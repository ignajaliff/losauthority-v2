/**
 * ricerca-tiktok — Crea idee → Ricerca TikTok top video (documento di Wesley
 * «Ricerca TikTok top video — regole per l'agente IA»). Solo clienti.
 *
 * Dal 07/10/2026 la ricerca è sempre in italiano, inglese e spagnolo (il cliente non sceglie la
 * lingua) e consegna una top per lingua.
 *
 * Body { azione, ... }:
 *  - "proponi" { tema } → { keyword[], proposte[{lingua, testo}] }: Aura propone una keyword per
 *    lingua partendo dal tema e da chi è il cliente (scheda onboarding, avatar, offerta); il
 *    cliente può modificarle e aggiungerne fino a 4. Non consuma la quota.
 *  - "avvia" { tema, keyword[], lingue?, quanti? } → { id }: `lingue` = le lingue delle caselle riempite
 *    (sottoinsieme di it, en, es; senza, tutte e tre); una ricerca ogni 15 giorni (le ricerche
 *    in errore non contano; la quota la garantisce anche il trigger `ricerche_tiktok_quota`).
 *    Crea la riga 'in_corso' e lancia la run Apify asincrona.
 *  - "controlla" { id } → { stato }: chiamata dal polling. Run finita → 'elaborazione' (update
 *    condizionale: una sola elaborazione), filtro, Claude scrive righe e segnali, top per lingua →
 *    'pronta'. Un'elaborazione non riuscita torna 'in_corso' e si riprova al controllo dopo (stessa
 *    run, nessun costo Apify) fino a RIPRESA_MAX_MS; run fallita, vuota o scaduta → 'errore'.
 * Rate limit di `proponi`: aura_help_allowed(user, 10, 3600, 'ricerca').
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { avviaRicerca, fermaRun, statoRun } from "./apify.ts";
import { elabora } from "./elabora.ts";
import { contestoCliente } from "./contesto.ts";
import { leggiKeyword, MODELLO_KEYWORD, MODELLO_RICERCA, promptKeyword, SYSTEM_KEYWORD } from "./prompt.ts";
import { ErroreElabora, LINGUE_RICERCA, MSG_APIFY, MSG_ELABORA, QUANTI_PER_LINGUA, type Ricerca } from "./tipi.ts";

type Body = { azione?: unknown; tema?: unknown; keyword?: unknown; lingue?: unknown; quanti?: unknown; id?: unknown };

const GIORNO = 86_400_000;
const GIORNI_TRA_RICERCHE = 15;
/** Una elaborazione ferma da più di così si può riprendere (la funzione è morta a metà). */
const ELABORAZIONE_BLOCCATA_MS = 5 * 60_000;
/** Oltre questo tempo una run ancora in corso (o illeggibile) si ferma: Apify la chiude già dopo 10 minuti. */
const IN_CORSO_MAX_MS = 20 * 60_000;
/** Fin qui un'elaborazione non riuscita si riprova sulla stessa run; dopo diventa errore. */
const RIPRESA_MAX_MS = 45 * 60_000;
/** Senza id della run dopo 2 minuti la run non è mai partita. */
const SENZA_RUN_MAX_MS = 2 * 60_000;

const dataIt = (d: Date) =>
  d.toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
/** «dal 7 ottobre», ma «dall'8 ottobre», «dall'1», «dall'11». */
const dal = (testo: string) => (/^(1|8|11)(?!\d)/.test(testo) ? `dall'${testo}` : `dal ${testo}`);

function leggiTema(v: unknown): string {
  const t = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  if (t.length < 3 || t.length > 200) throw new HttpError(400, "Scrivi il tema (da 3 a 200 caratteri).");
  return t;
}

function leggiKeywordBody(v: unknown): string[] {
  const lista = (Array.isArray(v) ? v : [])
    .filter((k): k is string => typeof k === "string")
    .map((k) => k.replace(/#/g, "").replace(/\s+/g, " ").trim())
    .filter((k) => k.length >= 2 && k.length <= 80);
  const uniche = [...new Map(lista.map((k) => [k.toLowerCase(), k])).values()];
  if (uniche.length === 0 || uniche.length > 4) throw new HttpError(400, "Servono da 1 a 4 keyword.");
  return uniche;
}

/** Prossima ricerca possibile, o null se si può già cercare. Le ricerche in errore non contano. */
async function prossimaDisponibile(admin: SupabaseClient, clienteId: string): Promise<Date | null> {
  const dal = new Date(Date.now() - GIORNI_TRA_RICERCHE * GIORNO).toISOString();
  const { data, error } = await admin
    .from("ricerche_tiktok")
    .select("created_at")
    .eq("cliente_id", clienteId)
    .neq("stato", "errore")
    .gte("created_at", dal)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const ultima = (data as Array<{ created_at: string }> | null)?.[0];
  return ultima ? new Date(new Date(ultima.created_at).getTime() + GIORNI_TRA_RICERCHE * GIORNO) : null;
}

const messaggioQuota = (prossima: Date | null) =>
  prossima
    ? `Puoi fare una ricerca ogni ${GIORNI_TRA_RICERCHE} giorni: la prossima ${dal(dataIt(prossima))}.`
    : `Puoi fare una ricerca ogni ${GIORNI_TRA_RICERCHE} giorni.`;

async function proponi(admin: SupabaseClient, utente: string, body: Body): Promise<Response> {
  const tema = leggiTema(body.tema);
  const { data: permesso, error } = await admin.rpc("aura_help_allowed", { p_user: utente, p_max: 10, p_window_secs: 3600, p_scope: "ricerca" });
  if (error) await logError("ricerca-tiktok:rate_limit", error, { user: utente }, { silent: true });
  else if (permesso === false) throw new HttpError(429, "Hai chiesto molte proposte di keyword: riprova tra un'ora.");
  const cliente = await contestoCliente(admin, utente);
  const testo = await streamAnthropicText({
    system: SYSTEM_KEYWORD,
    user: promptKeyword(tema, LINGUE_RICERCA, cliente),
    maxTokens: 400,
    tag: "ricerca-tiktok:keyword",
    model: MODELLO_KEYWORD,
    utente,
  });
  const proposte = leggiKeyword(testo, LINGUE_RICERCA);
  if (proposte.length === 0) throw new HttpError(503, "Aura non è riuscita a proporre le keyword: scrivile tu o riprova.");
  return json({ ok: true, keyword: proposte.map((p) => p.testo), proposte });
}

async function avvia(admin: SupabaseClient, utente: string, body: Body): Promise<Response> {
  const tema = leggiTema(body.tema);
  const keyword = leggiKeywordBody(body.keyword);
  // Le lingue delle caselle riempite (una lasciata vuota si salta); senza indicazione tutte e tre.
  const scelte = Array.isArray(body.lingue) ? LINGUE_RICERCA.filter((l) => (body.lingue as unknown[]).includes(l)) : [];
  const lingue = scelte.length > 0 ? scelte : [...LINGUE_RICERCA];
  // Video in ogni top per lingua.
  const quanti = typeof body.quanti === "number" && body.quanti >= 5 && body.quanti <= 30 ? Math.round(body.quanti) : QUANTI_PER_LINGUA;

  const prossima = await prossimaDisponibile(admin, utente);
  if (prossima) throw new HttpError(429, messaggioQuota(prossima));

  // Il trigger `ricerche_tiktok_quota` rifiuta anche due richieste parallele.
  const { data: riga, error } = await admin
    .from("ricerche_tiktok")
    .insert({ cliente_id: utente, tema, lingue, lingua_target: lingue[0], keyword, quanti, metodo: "keyword", modello: MODELLO_RICERCA })
    .select("id")
    .single();
  if (error && /ricerca_tiktok_quota/.test(error.message)) throw new HttpError(429, messaggioQuota(await prossimaDisponibile(admin, utente)));
  if (error || !riga) throw error ?? new Error("ricerca non creata");
  const id = (riga as { id: string }).id;

  const run = await avviaRicerca(keyword);
  if (!run.ok) {
    await admin.from("ricerche_tiktok").update({ stato: "errore", errore: MSG_APIFY }).eq("id", id);
    // Incerto (rete, timeout, 5xx): la run potrebbe essere partita e costare lo stesso.
    await logError(run.incerto ? "ricerca-tiktok:avvia-incerto" : "ricerca-tiktok:avvia", run.dettaglio, { user: utente, ricerca: id, keyword });
    throw new HttpError(502, MSG_APIFY);
  }

  const salvaRun = () => admin.from("ricerche_tiktok").update({ apify_run_id: run.runId }).eq("id", id);
  let { error: errRun } = await salvaRun();
  if (errRun) ({ error: errRun } = await salvaRun());
  if (errRun) {
    // Senza id la ricerca non si potrebbe mai completare: si ferma la run e si libera la quota.
    await fermaRun(run.runId);
    await admin.from("ricerche_tiktok").update({ stato: "errore", errore: MSG_APIFY }).eq("id", id);
    await logError("ricerca-tiktok:avvia", errRun, { user: utente, ricerca: id, run: run.runId });
    throw new HttpError(502, MSG_APIFY);
  }
  return json({ ok: true, id });
}

async function chiudiInErrore(admin: SupabaseClient, id: string, errore: string, daStati: string[]): Promise<Response> {
  await admin.from("ricerche_tiktok").update({ stato: "errore", errore }).eq("id", id).in("stato", daStati);
  return json({ ok: true, stato: "errore" });
}

async function controlla(admin: SupabaseClient, utente: string, body: Body): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "Ricerca non valida.");
  const { data } = await admin
    .from("ricerche_tiktok")
    .select("id, cliente_id, tema, lingua_target, lingue, keyword, quanti, stato, apify_run_id, created_at, updated_at")
    .eq("id", id)
    .eq("cliente_id", utente)
    .maybeSingle();
  if (!data) throw new HttpError(404, "Ricerca non trovata.");
  const r = data as Ricerca;
  if (r.stato === "pronta" || r.stato === "errore") return json({ ok: true, stato: r.stato });

  const eta = Date.now() - new Date(r.created_at).getTime();
  const bloccata = r.stato === "elaborazione" && Date.now() - new Date(r.updated_at).getTime() > ELABORAZIONE_BLOCCATA_MS;
  if (r.stato === "elaborazione" && !bloccata) return json({ ok: true, stato: r.stato });
  // Elaborazione uccisa più volte (il catch non gira mai): oltre RIPRESA_MAX_MS si chiude e la quota torna libera.
  if (bloccata && eta > RIPRESA_MAX_MS) return await chiudiInErrore(admin, r.id, MSG_ELABORA, ["elaborazione"]);

  if (!r.apify_run_id) {
    // La run non è mai partita (funzione morta tra insert e avvio): libera la quota.
    if (Date.now() - new Date(r.updated_at).getTime() > SENZA_RUN_MAX_MS) return await chiudiInErrore(admin, r.id, MSG_APIFY, ["in_corso"]);
    return json({ ok: true, stato: r.stato });
  }

  const run = await statoRun(r.apify_run_id);
  if (!run.ok || run.stato === "in_corso") {
    if (r.stato === "in_corso" && eta > IN_CORSO_MAX_MS) {
      await fermaRun(r.apify_run_id);
      await logError("ricerca-tiktok:scaduta", run.ok ? `run ancora ${run.dettaglio}` : run.dettaglio, { user: utente, ricerca: r.id });
      return await chiudiInErrore(admin, r.id, MSG_APIFY, ["in_corso"]);
    }
    if (!run.ok) await logError("ricerca-tiktok:stato", run.dettaglio, { user: utente, ricerca: r.id }, { silent: true });
    return json({ ok: true, stato: r.stato });
  }
  if (run.stato === "fallita" || !run.datasetId) {
    await logError("ricerca-tiktok:run", `run ${run.dettaglio}`, { user: utente, ricerca: r.id });
    return await chiudiInErrore(admin, r.id, MSG_APIFY, ["in_corso", "elaborazione"]);
  }

  // Prende in carico l'elaborazione: solo una chiamata ci riesce.
  const presa = admin.from("ricerche_tiktok").update({ stato: "elaborazione" }).eq("id", r.id);
  const { data: presi } = await (bloccata ? presa.eq("stato", "elaborazione").eq("updated_at", r.updated_at) : presa.eq("stato", "in_corso")).select("id");
  if (!presi || presi.length === 0) return json({ ok: true, stato: "elaborazione" });

  try {
    // La soglia dei 6 mesi parte da quando Apify ha raccolto i dati, non da quando li elaboriamo.
    const stato = await elabora(admin, r, run.datasetId, run.finitaIl ?? new Date(r.created_at));
    return json({ ok: true, stato });
  } catch (err) {
    const definitivo = err instanceof ErroreElabora && err.definitivo;
    await logError("ricerca-tiktok:elabora", err, { user: utente, ricerca: r.id, definitivo }, { silent: !definitivo && eta <= RIPRESA_MAX_MS });
    if (!definitivo && eta <= RIPRESA_MAX_MS) {
      // Stessa run, stesso dataset: il prossimo controllo riprova senza nuovi costi Apify.
      await admin.from("ricerche_tiktok").update({ stato: "in_corso" }).eq("id", r.id).eq("stato", "elaborazione");
      return json({ ok: true, stato: "in_corso" });
    }
    return await chiudiInErrore(admin, r.id, MSG_ELABORA, ["elaborazione"]);
  }
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "La ricerca TikTok è riservata ai clienti.");
    const body = await leggiBody<Body>(req);
    const admin = adminClient();
    if (body.azione === "proponi") {
      if (!HAS_ANTHROPIC) throw new HttpError(500, "ANTHROPIC_API_KEY non configurata.");
      return await proponi(admin, c.id, body);
    }
    if (body.azione === "avvia") return await avvia(admin, c.id, body);
    if (body.azione === "controlla") return await controlla(admin, c.id, body);
    throw new HttpError(400, "Azione non valida.");
  } catch (err) {
    return gestisciErrore(err);
  }
});
