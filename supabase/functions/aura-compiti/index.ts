/**
 * aura-compiti — "Genera compiti con Aura": dal riassunto di una call ai compiti
 * sulla board "Compiti per call n°X" dell'hub Notion del cliente (porta di
 * generaCompitiDaCall in src/lib/hub/actions.ts). A DUE STADI: piano (JSON
 * piccolo) → espansione di ogni compito in parallelo, col piano nel contesto.
 * Body: { chiamata_id, call_n: 1..4 } → { ok, scritti, totale }.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediTeam } from "../_shared/supabase.ts";
import { HAS_ANTHROPIC } from "../_shared/anthropic.ts";
import { HAS_NOTION } from "../_shared/config.ts";
import { logError } from "../_shared/log.ts";
import { fathomConfigurato, getFathomSummary, traduciRiassunto } from "../_shared/fathom.ts";
import { leggiMateriale, nomeCliente, renderDossier } from "../_shared/materiale.ts";
import { syncCliente } from "../_shared/hub-sync.ts";
import { generaPiano, pianoInTesto } from "./piano.ts";
import { espandiCompito, type LessonRef } from "./espandi.ts";
import { createCompito, NOTION_WESLEY_USER_ID } from "./scrivi.ts";

type Body = {
  chiamata_id?: unknown;
  call_n?: unknown;
}
interface RigaChiamata {
  id: string;
  cliente_id: string | null;
  riassunto: string | null;
  fathom_recording_id: string | null;
}
interface RigaBoard {
  id: string;
  call_n: number;
  notion_db_id: string;
}

/**
 * Il catalogo che diamo ad Aura: solo lezioni attive, ordinate per corso.
 * [] se il catalogo è vuoto (Aura semplicemente non aggancia nulla).
 */
async function lessonCatalog(admin: SupabaseClient): Promise<LessonRef[]> {
  const { data } = await admin
    .from("lezioni")
    .select("titolo, corso, url")
    .eq("attiva", true)
    .order("corso", { ascending: true, nullsFirst: false })
    .order("ordine", { ascending: true })
    .limit(200);
  return ((data ?? []) as LessonRef[]).map((r) => ({ titolo: r.titolo, corso: r.corso ?? null, url: r.url ?? null }));
}

/** Board del cliente; se manca la fotografia, prova una sync prima di arrendersi. */
async function boardsCliente(admin: SupabaseClient, clienteId: string, hubUrl: string): Promise<RigaBoard[]> {
  const leggi = async () => {
    const { data } = await admin.from("hub_board").select("id, call_n, notion_db_id").eq("cliente_id", clienteId);
    return (data ?? []) as RigaBoard[];
  };
  let boards = await leggi();
  if (boards.length === 0) {
    await syncCliente(admin, clienteId, hubUrl);
    boards = await leggi();
  }
  return boards;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediTeam(req);
    const { chiamata_id, call_n } = await leggiBody<Body>(req);
    const callN = Number(call_n);
    if (typeof chiamata_id !== "string" || !chiamata_id || !Number.isInteger(callN) || callN < 1 || callN > 4) {
      return errore("Dati non validi.", 400);
    }
    if (!HAS_NOTION || !HAS_ANTHROPIC) return errore("NOTION_TOKEN o ANTHROPIC_API_KEY non configurati.", 500);
    const admin = adminClient();

    // 1) La call e il suo riassunto (se manca lo scarico ora da Fathom).
    const { data: cRaw } = await admin
      .from("chiamate")
      .select("id, cliente_id, riassunto, fathom_recording_id")
      .eq("id", chiamata_id)
      .maybeSingle();
    const chiamata = cRaw as RigaChiamata | null;
    if (!chiamata) return errore("Call non trovata.", 404);
    if (!chiamata.cliente_id) return errore("Questa call non è assegnata a nessun cliente.", 400);
    const clienteId = chiamata.cliente_id;

    let summary = chiamata.riassunto;
    if (!summary && chiamata.fathom_recording_id && fathomConfigurato()) {
      const originale = await getFathomSummary(chiamata.fathom_recording_id);
      if (originale) {
        summary = await traduciRiassunto(originale);
        await admin.from("chiamate").update({ riassunto: summary, riassunto_originale: originale }).eq("id", chiamata_id);
      }
    }
    if (!summary) return errore("Fathom non ha ancora il riassunto di questa call: riprova tra qualche minuto.", 400);

    // 2) Hub, board di destinazione, compiti già aperti e PROFILO del cliente
    //    (per ancorare i compiti ai suoi fatti reali: numeri, nomi, parole sue).
    const { data: clRaw } = await admin.from("clienti").select("notion_hub_url").eq("id", clienteId).maybeSingle();
    const hubUrl = (clRaw as { notion_hub_url: string | null } | null)?.notion_hub_url;
    if (!hubUrl) return errore("Questo cliente non ha ancora un hub Notion collegato.", 400);

    const boards = await boardsCliente(admin, clienteId, hubUrl);
    const target = boards.find((b) => b.call_n === callN);
    if (!target) return errore(`Board "Compiti per call n°${callN}" non trovata nell'hub.`, 404);

    const [{ data: apertiRaw }, { data: analisiRaw }, materiale, clientName] = await Promise.all([
      admin.from("hub_compiti").select("titolo").in("board_id", boards.map((b) => b.id)).neq("stato", "done"),
      admin.from("analisi").select("contenuto").eq("cliente_id", clienteId).maybeSingle(),
      leggiMateriale(admin, clienteId),
      nomeCliente(admin, clienteId, "il cliente"),
    ]);
    const aperti = ((apertiRaw ?? []) as Array<{ titolo: string }>).map((t) => t.titolo);
    const analisi = (analisiRaw as { contenuto: string } | null)?.contenuto ?? "";
    const profilo = (analisi.trim().length > 40 ? `ANALISI STRATEGICA (già scritta da Aura):\n${analisi}\n\n` : "") + renderDossier(materiale);

    // 3) Aura propone: piano (stadio 1) e catalogo lezioni insieme, poi espansione in parallelo (stadio 2).
    const [piano, lezioni] = await Promise.all([
      generaPiano({ clientName, callNumber: callN, profilo, summary, compitiAperti: aperti }),
      lessonCatalog(admin).catch(() => [] as LessonRef[]),
    ]);
    if (!piano || piano.length === 0) {
      await logError("aura-compiti:piano", "piano non generato", { chiamata_id, clienteId });
      return errore("Aura non è riuscita a generare compiti da questa call. Riprova.", 502);
    }
    const ctx = { clientName, callNumber: callN, profilo, summary, lezioni };
    const pianoText = pianoInTesto(piano);
    const bodies = await Promise.all(piano.map((item) => espandiCompito(ctx, pianoText, item)));

    // 4) Scrittura sulla board: compiti del cliente numerati (1., 2., …); impegni
    //    di Wesley con prefisso [WESLEY] e Assigned To.
    let scritti = 0;
    let nCliente = 0;
    for (let i = 0; i < piano.length; i++) {
      const p = piano[i];
      const isWesley = p.chi === "wesley";
      const titolo = isWesley ? `[WESLEY] ${p.titolo}` : `${++nCliente}. ${p.titolo}`;
      const ok = await createCompito(target.notion_db_id, titolo, {
        assignUserId: isWesley ? NOTION_WESLEY_USER_ID || null : null,
        body: bodies[i],
      });
      if (ok) scritti++;
    }
    if (scritti === 0) {
      await logError("aura-compiti:zero", "Nessun compito scritto", { clienteId, chiamata_id });
      return errore("Non sono riuscita a scrivere i compiti su Notion. Riprova.", 502);
    }

    // 5) Risincronizza il gestionale (prima della risposta: niente lavoro dopo l'HTTP).
    await syncCliente(admin, clienteId, hubUrl);
    return json({ ok: true, scritti, totale: piano.length });
  } catch (err) {
    return gestisciErrore(err);
  }
});
