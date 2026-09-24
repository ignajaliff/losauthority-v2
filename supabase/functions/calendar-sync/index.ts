/**
 * calendar-sync — Google Calendar (Apps Script) → prossima call dei clienti.
 * Auth: `Authorization: Bearer <CALENDAR_SYNC_SECRET>` (verify_jwt: false).
 * Body: { eventi: [{ inizio: ISO, invitati: string[] }] } → { ok, aggiornati }.
 * Per ogni cliente invitato imposta la call futura più vicina come ISTANTE
 * REALE (ISO UTC: l'Apps Script manda ISO con offset, il frontend formatta nel
 * fuso del browser) con source 'calendar'; le call 'calendar' sparite dal feed
 * vengono azzerate. Le call manuali non si toccano.
 */
import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { logError } from "../_shared/log.ts";
import { CALENDAR_SYNC_SECRET } from "../_shared/config.ts";

type EventoIn = {
  inizio?: unknown;
  invitati?: unknown;
}

type Body = {
  eventi?: unknown;
}

interface UtenteCliente {
  id: string;
  email: string | null;
}

const MAX_EVENTI = 1000;

function autorizzato(req: Request): boolean {
  if (!CALENDAR_SYNC_SECRET) return false;
  return (req.headers.get("Authorization") ?? "") === `Bearer ${CALENDAR_SYNC_SECRET}`;
}

/** Per ogni cliente invitato, l'istante dell'evento FUTURO più vicino. */
function primaCallPerCliente(eventi: EventoIn[], emailCliente: Map<string, string>): Map<string, number> {
  const adesso = Date.now();
  const prima = new Map<string, number>();
  for (const ev of eventi) {
    const t = typeof ev.inizio === "string" ? Date.parse(ev.inizio) : NaN;
    if (!Number.isFinite(t) || t <= adesso) continue;
    const invitati = Array.isArray(ev.invitati) ? ev.invitati : [];
    for (const inv of invitati) {
      const email = typeof inv === "string" ? inv.trim().toLowerCase() : "";
      const clienteId = email ? emailCliente.get(email) : undefined;
      if (!clienteId) continue;
      const attuale = prima.get(clienteId);
      if (attuale === undefined || t < attuale) prima.set(clienteId, t);
    }
  }
  return prima;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    if (!autorizzato(req)) return errore("Non autorizzato", 401);
    const body = await leggiBody<Body>(req);
    const eventi = (Array.isArray(body.eventi) ? body.eventi : []).slice(0, MAX_EVENTI) as EventoIn[];
    const admin = adminClient();

    const { data: utentiRaw, error: errUtenti } = await admin
      .from("user_roles")
      .select("id, email")
      .eq("rol", "cliente");
    if (errUtenti) {
      await logError("calendar-sync:clienti", errUtenti);
      return errore("Errore lettura clienti", 500);
    }
    const emailCliente = new Map<string, string>();
    for (const u of (utentiRaw ?? []) as UtenteCliente[]) {
      const email = u.email?.trim().toLowerCase();
      if (email) emailCliente.set(email, u.id);
    }

    const prima = primaCallPerCliente(eventi, emailCliente);

    // 1) Imposta/aggiorna le call trovate nel calendario.
    let aggiornati = 0;
    for (const [clienteId, ts] of prima) {
      const { error } = await admin
        .from("clienti")
        .update({ prossima_call: new Date(ts).toISOString(), prossima_call_source: "calendar" })
        .eq("id", clienteId);
      if (error) await logError("calendar-sync:update", error, { clienteId }, { silent: true });
      else aggiornati++;
    }

    // 2) Azzera le call di origine calendario non più presenti nel feed.
    const { data: gestiteRaw } = await admin.from("clienti").select("id").eq("prossima_call_source", "calendar");
    for (const riga of (gestiteRaw ?? []) as { id: string }[]) {
      if (prima.has(riga.id)) continue;
      const { error } = await admin
        .from("clienti")
        .update({ prossima_call: null, prossima_call_source: null })
        .eq("id", riga.id);
      if (error) await logError("calendar-sync:azzera", error, { clienteId: riga.id }, { silent: true });
    }

    return json({ ok: true, aggiornati, eventi: eventi.length });
  } catch (err) {
    return gestisciErrore(err);
  }
});
