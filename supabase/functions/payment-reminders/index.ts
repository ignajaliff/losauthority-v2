/**
 * payment-reminders — promemoria Telegram delle scadenze di DOMANI:
 * fatture non pagate con prossimo_pagamento = domani e F24 non pagati con
 * scadenza = domani. Lanciato da pg_cron (CRON_SECRET) o a mano dal team.
 * Risposta { ok, fatture, f24 }. Nessun messaggio se non c'è nulla.
 */
import { gestisciErrore, HttpError, json, preflight } from "../_shared/http.ts";
import { adminClient, richiediCronOTeam } from "../_shared/supabase.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { logError } from "../_shared/log.ts";
import { SITE_URL } from "../_shared/config.ts";

interface Fattura {
  id: string;
  importo: number | string;
  descrizione: string | null;
  cliente_id: string;
}

interface F24 {
  id: string;
  importo: number | string | null;
  descrizione: string | null;
}

interface Utente {
  id: string;
  nombre: string | null;
  email: string | null;
}

function eur(n: number | string | null): string {
  const v = Number(n ?? 0);
  return "€" + (Number.isFinite(v) ? v : 0).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Data "YYYY-MM-DD" di oggi in ora italiana (le scadenze sono date a muro). */
function oggiRoma(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());
}

function aggiungiGiorni(iso: string, giorni: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

function dataIt(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediCronOTeam(req);
    const admin = adminClient();
    const domani = aggiungiGiorni(oggiRoma(), 1);

    const { data: fattureRaw, error: errFatture } = await admin
      .from("fatture")
      .select("id, importo, descrizione, cliente_id")
      .eq("pagata", false)
      .eq("prossimo_pagamento", domani);
    if (errFatture) {
      await logError("payment-reminders:fatture", errFatture, { domani });
      throw new HttpError(500, "Non sono riuscito a leggere le fatture.");
    }
    const fatture = (fattureRaw ?? []) as Fattura[];

    const { data: f24Raw, error: errF24 } = await admin
      .from("f24")
      .select("id, importo, descrizione")
      .eq("pagato", false)
      .eq("scadenza", domani);
    if (errF24) await logError("payment-reminders:f24", errF24, { domani });
    const f24 = (f24Raw ?? []) as F24[];

    if (fatture.length === 0 && f24.length === 0) {
      return json({ ok: true, fatture: 0, f24: 0, domani });
    }

    const blocchi: string[] = [];
    if (fatture.length > 0) {
      const ids = [...new Set(fatture.map((f) => f.cliente_id))];
      const { data: utentiRaw } = await admin.from("user_roles").select("id, nombre, email").in("id", ids);
      const utenti = new Map(((utentiRaw ?? []) as Utente[]).map((u) => [u.id, u]));
      const righe = fatture.map((f) => {
        const u = utenti.get(f.cliente_id);
        const nome = u?.nombre || u?.email || "Cliente";
        const desc = f.descrizione ? ` · ${f.descrizione}` : "";
        return `• ${nome} — ${eur(f.importo)}${desc}\n  👉 ${SITE_URL}/clienti/${f.cliente_id}`;
      });
      blocchi.push(`💶 Fatture in scadenza (${fatture.length})\n${righe.join("\n")}`);
    }
    if (f24.length > 0) {
      const righe = f24.map((x) => {
        const imp = x.importo != null ? eur(x.importo) : "importo da inserire";
        return `• ${x.descrizione || "F24"} — ${imp}`;
      });
      blocchi.push(`🧾 F24 da pagare (${f24.length})\n${righe.join("\n")}\n👉 ${SITE_URL}/finance?tab=f24`);
    }

    await notifyTelegram(`⏰ Scadenze di DOMANI — ${dataIt(domani)}\n\n${blocchi.join("\n\n")}`);
    return json({ ok: true, fatture: fatture.length, f24: f24.length, domani });
  } catch (err) {
    return gestisciErrore(err);
  }
});
