/**
 * Il percorso del cliente sul suo link personale, lato server:
 *   1) salvaDati  — «Elabora»: controlla i dati e compone il contratto
 *   2) firma      — salva le due firme, il testo e le prove; genera il PDF
 * Il browser non decide mai il testo: lo compone sempre il server. Alla firma
 * la pagina manda l'impronta del testo che ha MOSTRATO: se non coincide con
 * quello ricomposto dai dati salvati, la firma è rifiutata (409).
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { logError } from "../_shared/log.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { archiviaPdf, componiDaRiga, contrattoPerToken, normalizzaRiga, type RigaContratto } from "../_shared/contratti-archivio.ts";
import { STATI_APERTI, STATI_FIRMATI, TIPI_CLIENTE, type DocumentoContratto, type TipoCliente } from "../_shared/contratti/tipi.ts";
import { nomeCliente, validaDati, validaFirma, type Errori } from "../_shared/contratti/validazione.ts";

export type Esito<T> = ({ ok: true } & T) | { ok: false; status: number; error: string; errori?: Errori; documento?: DocumentoContratto; sha?: string };

function chiuso(row: RigaContratto): Esito<never> {
  if (row.stato === "annullato") return { ok: false, status: 410, error: "Questo link non è più valido. Scrivi a Wesley per riceverne uno nuovo." };
  return { ok: false, status: 409, error: "Questo contratto è già stato firmato." };
}

/** «Elabora»: il cliente ha compilato il modulo e vuole vedere il suo contratto. */
export async function salvaDati(admin: SupabaseClient, token: string, body: Record<string, unknown>): Promise<Esito<{ documento: DocumentoContratto; sha: string }>> {
  const row = await contrattoPerToken(admin, token);
  if (!row) return { ok: false, status: 404, error: "Link non valido." };
  if (!STATI_APERTI.includes(row.stato)) return chiuso(row);

  const tipo = body.tipo as TipoCliente;
  if (!TIPI_CLIENTE.includes(tipo)) return { ok: false, status: 422, error: "Scegli come acquisti il programma." };
  if (body.informativa !== true) return { ok: false, status: 422, error: "Conferma di aver letto l'informativa sul trattamento dei dati." };
  if (body.dichiarazione !== true) return { ok: false, status: 422, error: "Conferma la dichiarazione su come acquisti il programma." };

  const esito = validaDati(tipo, body.dati);
  if (!esito.ok) return { ok: false, status: 422, error: "Controlla i campi segnati in rosso.", errori: esito.errori };

  const { documento, sha } = await componiDaRiga(admin, row, tipo, esito.dati);
  const adesso = new Date().toISOString();
  const { data, error } = await admin
    .from("contratti")
    .update({
      tipo,
      dati: esito.dati,
      cliente_nome: nomeCliente(tipo, esito.dati),
      cliente_email: esito.dati.email,
      compilato_il: adesso,
      informativa_letta_il: adesso,
      stato: "compilato",
    })
    .eq("id", row.id)
    .in("stato", STATI_APERTI)
    .select("id");
  if (error) {
    await logError("contratto:salvaDati", error, { id: row.id });
    return { ok: false, status: 500, error: "Non sono riuscito a salvare i dati. Riprova tra un momento." };
  }
  if (!data || data.length === 0) {
    const ora = await contrattoPerToken(admin, token);
    return ora ? chiuso(ora) : { ok: false, status: 404, error: "Link non valido." };
  }
  return { ok: true, documento, sha };
}

function ipDellaRichiesta(req: Request): string | null {
  const inoltrato = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (inoltrato) return inoltrato.slice(0, 64);
  const reale = req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip");
  return reale ? reale.slice(0, 64) : null;
}

/** La firma: da qui in poi il contratto non si modifica più. */
export async function firma(admin: SupabaseClient, token: string, body: Record<string, unknown>, req: Request): Promise<Esito<{ firmato_il: string }>> {
  const row = await contrattoPerToken(admin, token);
  if (!row) return { ok: false, status: 404, error: "Link non valido." };
  if (STATI_FIRMATI.includes(row.stato) && row.firmato_il) {
    // Doppio clic o pagina rimasta aperta: è già firmato, va bene così.
    return { ok: true, firmato_il: new Date(row.firmato_il).toISOString() };
  }
  if (row.stato !== "compilato" || !row.tipo) {
    return row.stato === "inviato" ? { ok: false, status: 409, error: "Prima inserisci i tuoi dati e premi Elabora." } : chiuso(row);
  }
  if (body.accetto !== true || body.approvo !== true) return { ok: false, status: 422, error: "Per firmare servono entrambe le conferme." };
  const firmaContratto = validaFirma(body.firma_contratto);
  const firmaClausole = validaFirma(body.firma_clausole);
  if (!firmaContratto || !firmaClausole) return { ok: false, status: 422, error: "Manca una delle due firme: tracciale entrambe nei riquadri." };

  // Il testo si ricompone dai dati salvati: deve essere ESATTAMENTE quello che il cliente ha letto.
  const esito = validaDati(row.tipo, row.dati);
  if (!esito.ok) return { ok: false, status: 409, error: "I dati non sono completi: torna al modulo e premi Elabora." };
  const { documento, sha } = await componiDaRiga(admin, row, row.tipo, esito.dati);
  if (body.sha !== sha) {
    return { ok: false, status: 409, error: "Il testo del contratto è cambiato da quando l'hai aperto. Rileggilo e firma di nuovo.", documento, sha };
  }

  const adesso = new Date().toISOString();
  const { data, error } = await admin
    .from("contratti")
    .update({
      stato: "firmato",
      firmato_il: adesso,
      firma_ip: ipDellaRichiesta(req),
      firma_user_agent: (req.headers.get("user-agent") ?? "").slice(0, 400) || null,
      modello: documento.modello,
      documento,
      testo_sha256: sha,
      firma_contratto: firmaContratto,
      firma_clausole: firmaClausole,
    })
    .eq("id", row.id)
    .eq("stato", "compilato")
    .select("*");
  if (error) {
    await logError("contratto:firma", error, { id: row.id });
    return { ok: false, status: 500, error: "Non sono riuscito a registrare la firma. Riprova tra un momento." };
  }
  if (!data || data.length === 0) {
    const ora = await contrattoPerToken(admin, token);
    if (ora?.firmato_il) return { ok: true, firmato_il: new Date(ora.firmato_il).toISOString() };
    return { ok: false, status: 409, error: "Qualcosa è cambiato: ricarica la pagina." };
  }

  const firmata = normalizzaRiga(data[0] as Record<string, unknown>);
  try {
    await archiviaPdf(admin, firmata);
  } catch (e) {
    await logError("contratto:pdf", e, { id: row.id }, { silent: true });
  }

  // Niente nome né importo: Telegram non deve ricevere dati del cliente. Chi ha firmato si vede dal gestionale (serve il login).
  const sito = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
  await notifyTelegram(
    `✍️ Un contratto è stato firmato.\nAprilo nel gestionale (Contratti) e, quando arriva il pagamento, segnalo.` + (sito ? `\n${sito}/contratti/${firmata.id}` : ""),
  );
  return { ok: true, firmato_il: adesso };
}
