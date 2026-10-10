/**
 * aura-avatar — "Cervello del tuo branding → Avatar" dell'area cliente. Il
 * cliente definisce il suo cliente ideale parlando con Aura; a ogni turno Aura
 * risponde e compila la carta (riga `avatar`).
 * Body:
 *   { azione: "crea" }                → nuovo avatar + primo messaggio di Aura. { ok, avatar_id }
 *   { avatar_id, messaggio }          → turno di conversazione.               { ok, messaggio_id, risposta, avatar }
 *   { riprova_messaggio_id }          → rifà una risposta finita in errore.
 * La riga di Aura in avatar_messaggi nasce 'in_corso' e finisce 'completato' o
 * 'errore' (riprovabile). Il metodo viene da aura_conoscenza (ambito 'avatar').
 * Lo stato 'completo' scatta solo se Aura lo dichiara E la riga unita ha
 * davvero tutti i campi richiesti (campiMancanti). Rate limit nel proprio
 * ambito: aura_help_allowed(user, 40, 3600, 'avatar'), anche per la creazione.
 * Max 12 avatar per cliente (trigger nel DB + messaggio umano qui).
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { ANTHROPIC_MODEL, HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { leggiMateriale, nomeCliente, renderScheda } from "../_shared/materiale.ts";
import { leggiLettura, renderLettura } from "../_shared/onboarding/lettura.ts";
import { bloccoKitBrand } from "../_shared/kit-brand.ts";
import { costruisciPrompt, messaggioApertura, SYSTEM, type Storico } from "./prompt.ts";
import { campiMancanti, estraiScheda, type CampiAvatar, type CampiDiagnosi } from "./scheda.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Body = { azione?: unknown; avatar_id?: unknown; messaggio?: unknown; riprova_messaggio_id?: unknown };

const MAX_MESSAGGIO = 4000;
// Finestra scorrevole: gli ultimi 12 messaggi (6 scambi). La memoria lunga è la CARTA,
// che entra intera a ogni turno: ciò che Aura annota nella scheda non si perde mai.
const MAX_STORICO = 12;
const MAX_AVATAR = 12;
const MSG_ERRORE_AURA = "Aura non riesce a rispondere in questo momento. Riprova tra poco.";

type Avatar = Record<string, unknown> & { id: string; stato: string; nome: string | null };

/** L'avatar del cliente (404 se non esiste o è di un altro). */
async function avatarDi(admin: SupabaseClient, clienteId: string, avatarId: string): Promise<Avatar> {
  const { data } = await admin.from("avatar").select("*").eq("id", avatarId).eq("cliente_id", clienteId).maybeSingle();
  if (!data) throw new HttpError(404, "Avatar non trovato.");
  return data as Avatar;
}

/** Nuovo avatar in compilazione + il primo messaggio di Aura (statico). */
async function crea(admin: SupabaseClient, clienteId: string) {
  const { count } = await admin.from("avatar").select("id", { count: "exact", head: true }).eq("cliente_id", clienteId);
  if ((count ?? 0) >= MAX_AVATAR) throw new HttpError(409, `Hai già ${MAX_AVATAR} avatar: elimina quelli che non usi prima di crearne altri.`);
  const { data: avatar, error } = await admin.from("avatar").insert({ cliente_id: clienteId, modello: ANTHROPIC_MODEL }).select("id").single();
  if (error || !avatar) throw error ?? new Error("avatar non creato");
  const avatarId = (avatar as { id: string }).id;
  const nome = await nomeCliente(admin, clienteId, "");
  const primo = nome.split(/\s+/)[0] ?? "";
  const { error: e2 } = await admin
    .from("avatar_messaggi")
    .insert({ avatar_id: avatarId, ruolo: "aura", stato: "completato", contenuto: messaggioApertura(primo.includes("@") ? "" : primo) });
  if (e2) throw e2;
  return avatarId;
}

/** Riprova: la riga di Aura in errore e il messaggio del cliente che la precede. */
async function perRiprova(admin: SupabaseClient, clienteId: string, auraId: string) {
  const { data: aura } = await admin.from("avatar_messaggi").select("id, avatar_id, created_at").eq("id", auraId).eq("ruolo", "aura").maybeSingle();
  if (!aura) throw new HttpError(404, "Messaggio non trovato.");
  const a = aura as { id: string; avatar_id: string; created_at: string };
  const avatar = await avatarDi(admin, clienteId, a.avatar_id);
  const { data: prec } = await admin
    .from("avatar_messaggi")
    .select("id, contenuto")
    .eq("avatar_id", a.avatar_id)
    .eq("ruolo", "cliente")
    .lt("created_at", a.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prec) throw new HttpError(400, "Nessun messaggio da riprovare.");
  await admin.from("avatar_messaggi").update({ stato: "in_corso", errore: null, contenuto: "" }).eq("id", a.id);
  const p = prec as { id: string; contenuto: string };
  return { avatar, auraId: a.id, clienteMsgId: p.id, messaggio: p.contenuto };
}

/** Contesto del turno: si escludono la riga Aura in corso e il messaggio del cliente (entra a parte come NUOVO MESSAGGIO). */
async function contesto(admin: SupabaseClient, clienteId: string, avatarId: string, escludi: string[]) {
  const [scheda, conoscenza, storico, nome, diagnosi, lettura, kitBrand] = await Promise.all([
    leggiMateriale(admin, clienteId).catch(() => null),
    admin.from("aura_conoscenza").select("titolo, contenuto").eq("ambito", "avatar").eq("attivo", true).order("ordine"),
    admin
      .from("avatar_messaggi")
      .select("ruolo, contenuto")
      .eq("avatar_id", avatarId)
      .not("id", "in", `(${escludi.join(",")})`)
      .eq("stato", "completato")
      .order("created_at", { ascending: false })
      .limit(MAX_STORICO),
    nomeCliente(admin, clienteId),
    admin.from("avatar_diagnosi").select("*").eq("avatar_id", avatarId).maybeSingle(),
    leggiLettura(admin, clienteId).catch(() => null),
    bloccoKitBrand(admin, clienteId),
  ]);
  const blocchi = ((conoscenza.data ?? []) as Array<{ titolo: string; contenuto: string }>).map((b) => `## ${b.titolo}\n${b.contenuto.trim()}`);
  return {
    nome,
    scheda: renderScheda(scheda),
    lettura: lettura ? renderLettura(lettura, "avatar") : "(non disponibile)",
    kitBrand,
    conoscenza: blocchi.join("\n\n"),
    storico: ((storico.data ?? []) as Storico[]).reverse(),
    diagnosi: (diagnosi.data as Record<string, unknown> | null) ?? null,
  };
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "La fase Avatar è riservata ai clienti.");
    const body = await leggiBody<Body>(req);
    const admin = adminClient();

    // Rate limit nel proprio ambito, prima di qualsiasi scrittura (anche la creazione).
    const { data: permesso, error: errLimite } = await admin.rpc("aura_help_allowed", { p_user: c.id, p_max: 40, p_window_secs: 3600, p_scope: "avatar" });
    if (errLimite) await logError("aura-avatar:rate_limit", errLimite, { user: c.id }, { silent: true });
    else if (permesso === false) throw new HttpError(429, "Hai scritto molto in poco tempo: riprova tra un'ora.");

    if (body.azione === "crea") {
      const avatarId = await crea(admin, c.id);
      return json({ ok: true, avatar_id: avatarId });
    }

    if (!HAS_ANTHROPIC) throw new HttpError(500, "ANTHROPIC_API_KEY non configurata.");

    let avatar: Avatar;
    let auraId: string;
    let clienteMsgId: string;
    let messaggio: string;
    if (typeof body.riprova_messaggio_id === "string" && body.riprova_messaggio_id) {
      ({ avatar, auraId, clienteMsgId, messaggio } = await perRiprova(admin, c.id, body.riprova_messaggio_id));
    } else {
      if (typeof body.avatar_id !== "string" || !body.avatar_id) throw new HttpError(400, "Avatar mancante.");
      avatar = await avatarDi(admin, c.id, body.avatar_id);
      messaggio = typeof body.messaggio === "string" ? body.messaggio.trim().slice(0, MAX_MESSAGGIO) : "";
      if (messaggio.length < 2) throw new HttpError(400, "Scrivi una risposta ad Aura.");
      const { data: mio, error: e1 } = await admin
        .from("avatar_messaggi")
        .insert({ avatar_id: avatar.id, ruolo: "cliente", contenuto: messaggio })
        .select("id")
        .single();
      if (e1 || !mio) throw e1 ?? new Error("messaggio cliente non creato");
      clienteMsgId = (mio as { id: string }).id;
      const { data: aura, error: e2 } = await admin
        .from("avatar_messaggi")
        .insert({ avatar_id: avatar.id, ruolo: "aura", stato: "in_corso", modello: ANTHROPIC_MODEL })
        .select("id")
        .single();
      if (e2 || !aura) throw e2 ?? new Error("messaggio aura non creato");
      auraId = (aura as { id: string }).id;
    }

    const dati = await contesto(admin, c.id, avatar.id, [auraId, clienteMsgId]);
    const testo = await streamAnthropicText({ system: SYSTEM, user: costruisciPrompt({ ...dati, avatar, messaggio }), maxTokens: 2500, tag: "aura-avatar", utente: c.id });
    if (!testo) {
      await admin.from("avatar_messaggi").update({ stato: "errore", errore: "Nessuna risposta dal modello" }).eq("id", auraId);
      await logError("aura-avatar:anthropic", "Nessuna risposta da Aura", { user: c.id, avatar: avatar.id }, { silent: true });
      throw new HttpError(503, MSG_ERRORE_AURA);
    }

    const { risposta, avatar: campi, diagnosi: campiDiagnosi, completo, motivo, grezzo } = estraiScheda(testo);
    if (motivo !== "ok") {
      // Il turno vale comunque (il testo arriva al cliente), ma un blocco mancante o rotto va visto.
      await logError(`aura-avatar:scheda_${motivo}`, `Blocco <scheda> ${motivo}`, { avatar: avatar.id, estratto: grezzo.slice(0, 500) }, { silent: true });
    }
    const contenuto = risposta || (Object.keys(campi).length + Object.keys(campiDiagnosi).length > 0 ? "Annotato sulla carta." : testo.trim());
    // La carta: solo i campi arrivati in questo turno. 'completo' solo se Aura lo dichiara E le righe unite hanno davvero tutto.
    const update: CampiAvatar & { stato?: string } = { ...campi };
    if (completo && avatar.stato !== "completo") {
      const mancanti = campiMancanti({ ...avatar, ...campi }, { ...(dati.diagnosi ?? {}), ...campiDiagnosi });
      if (mancanti.length === 0) update.stato = "completo";
      else await logError("aura-avatar:completo_incompleto", `Chiusura prematura: mancano ${mancanti.join(", ")}`, { avatar: avatar.id }, { silent: true });
    }
    if (Object.keys(update).length > 0) {
      const { error: e3 } = await admin.from("avatar").update(update).eq("id", avatar.id);
      if (e3) {
        // Una scheda che viola un vincolo non deve far perdere la risposta: la logghiamo e andiamo avanti.
        await logError("aura-avatar:update", e3, { avatar: avatar.id, campi: Object.keys(update) }, { silent: true });
      }
    }
    if (Object.keys(campiDiagnosi).length > 0) {
      // La diagnosi per Wesley: tabella a parte, che il cliente non legge.
      const riga: CampiDiagnosi & { avatar_id: string } = { avatar_id: avatar.id, ...campiDiagnosi };
      const { error: e5 } = await admin.from("avatar_diagnosi").upsert(riga, { onConflict: "avatar_id" });
      if (e5) await logError("aura-avatar:diagnosi", e5, { avatar: avatar.id, campi: Object.keys(campiDiagnosi) }, { silent: true });
    }
    const { error: e4 } = await admin.from("avatar_messaggi").update({ stato: "completato", contenuto, errore: null }).eq("id", auraId);
    if (e4) throw e4;
    const aggiornato = await avatarDi(admin, c.id, avatar.id);
    return json({ ok: true, messaggio_id: auraId, risposta: contenuto, avatar: aggiornato });
  } catch (err) {
    return gestisciErrore(err);
  }
});
