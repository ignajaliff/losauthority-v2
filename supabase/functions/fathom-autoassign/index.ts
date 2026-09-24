import { errore, gestisciErrore, json, preflight } from "../_shared/http.ts";
import { adminClient, richiediCronOTeam } from "../_shared/supabase.ts";
import { aggiornaSync, logError } from "../_shared/log.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { SITE_URL } from "../_shared/config.ts";
import {
  cleanCallTitle,
  fathomConfigurato,
  listRecentFathomCalls,
  type ParsedFathomCall,
  traduciRiassunto,
} from "../_shared/fathom.ts";
import { abbinaCliente, type ClienteEmail, clientiPerEmail, scriviAzioni, upsertChiamata } from "../_shared/chiamate.ts";

/**
 * Rete di sicurezza del webhook (che può spegnersi in silenzio): ogni 15 minuti
 * legge le call recenti dall'API Fathom, inserisce quelle nuove (anche senza
 * cliente, per l'assegnazione manuale) e abbina per email degli invitati.
 * Riprova l'abbinamento anche per le chiamate già presenti senza cliente.
 * Le traduzioni sono limitate per restare nel tempo massimo della funzione.
 */

const CALL_ESAMINATE = 30;
const MAX_TRADUZIONI = 3;

interface RigaEsistente {
  id: string;
  fathom_recording_id: string;
  cliente_id: string | null;
}

interface Esito {
  esaminate: number;
  inserite: number;
  nuove: string[];
}

async function riabbina(
  admin: ReturnType<typeof adminClient>,
  riga: RigaEsistente,
  cliente: ClienteEmail,
  call: ParsedFathomCall,
): Promise<boolean> {
  const { error } = await admin
    .from("chiamate")
    .update({ cliente_id: cliente.id })
    .eq("id", riga.id)
    .is("cliente_id", null);
  if (error) {
    await logError("fathom-autoassign:riabbina", error, { recordingId: call.recordingId });
    return false;
  }
  return true;
}

async function elabora(recenti: ParsedFathomCall[]): Promise<Esito> {
  const admin = adminClient();
  const { data: righe, error } = await admin
    .from("chiamate")
    .select("id, fathom_recording_id, cliente_id")
    .not("fathom_recording_id", "is", null);
  if (error) throw error;
  const esistenti = new Map<string, RigaEsistente>();
  for (const r of (righe ?? []) as RigaEsistente[]) esistenti.set(r.fathom_recording_id, r);

  const mappa = await clientiPerEmail(admin);
  const esito: Esito = { esaminate: recenti.length, inserite: 0, nuove: [] };
  let traduzioni = 0;

  for (const call of recenti) {
    if (!call.recordingId) continue;
    const cliente = abbinaCliente(mappa, call.invitees);
    const titolo = cleanCallTitle(call.title, call.recordedAt) ?? "call";
    const etichetta = `${cliente?.nombre ?? "?"} — ${titolo}`;

    const riga = esistenti.get(call.recordingId);
    if (riga) {
      if (!riga.cliente_id && cliente && (await riabbina(admin, riga, cliente, call))) esito.nuove.push(etichetta);
      continue;
    }

    let riassunto: string | null = null;
    if (call.summary && cliente && traduzioni < MAX_TRADUZIONI) {
      traduzioni += 1;
      riassunto = await traduciRiassunto(call.summary);
    }
    try {
      const salvata = await upsertChiamata(admin, {
        fathom_recording_id: call.recordingId,
        cliente_id: cliente?.id ?? null,
        titolo,
        registrata_il: call.recordedAt,
        share_url: call.shareUrl,
        riassunto_originale: call.summary,
        riassunto,
      });
      if (salvata.nuova && call.actionItems.length > 0) await scriviAzioni(admin, salvata.id, call.actionItems);
    } catch (err) {
      await logError("fathom-autoassign:upsert", err, { recordingId: call.recordingId });
      continue;
    }
    esito.inserite += 1;
    if (cliente) esito.nuove.push(etichetta);
  }
  return esito;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediCronOTeam(req);
  } catch (err) {
    return gestisciErrore(err);
  }
  if (!fathomConfigurato()) return errore("FATHOM_API_KEY non configurata", 500);

  const recenti = await listRecentFathomCalls(CALL_ESAMINATE, { riassunto: true, azioni: true });
  if (recenti === null) {
    await logError("fathom-autoassign:api", "API Fathom non raggiungibile", {}, { silent: true });
    await aggiornaSync("fathom", { esito: "errore", dettaglio: "API Fathom non raggiungibile" });
    return errore("Fathom non risponde. Riprova tra poco.", 502);
  }

  let esito: Esito;
  try {
    esito = await elabora(recenti);
  } catch (err) {
    await logError("fathom-autoassign:elabora", err);
    await aggiornaSync("fathom", { esito: "errore", dettaglio: "Errore lettura dati" });
    return errore("Errore durante l'assegnazione. Riprova tra poco.", 500);
  }

  if (esito.nuove.length > 0) {
    await notifyTelegram(
      `📞 Call assegnate in automatico (${esito.nuove.length})\n\n` +
        esito.nuove.map((n) => `• ${n}`).join("\n") +
        `\n\n👉 ${SITE_URL}/clienti`,
    );
  }
  await aggiornaSync("fathom", {
    esito: "ok",
    totale: esito.esaminate,
    nuove: esito.nuove.length,
    dettaglio: `${esito.inserite} inserite, ${esito.nuove.length} assegnate`,
  });
  return json({
    ok: true,
    nuove: esito.nuove.length,
    esaminate: esito.esaminate,
    inserite: esito.inserite,
    assegnate: esito.nuove,
  });
});
