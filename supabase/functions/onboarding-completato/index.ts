/**
 * onboarding-completato — chiamata dal cliente dopo l'invio di una scheda.
 * Se le 3 schede sono `inviato`: calcola profilo/ore_operative, segna il
 * cliente come completato (solo da nuovo/in_lavorazione) e avvisa su Telegram
 * UNA sola volta (alla transizione di stato).
 */
import { gestisciErrore, HttpError, json, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { logError } from "../_shared/log.ts";
import { SITE_URL } from "../_shared/config.ts";
import { calcolaProfilo, type RispostaOnboarding } from "./profilo.ts";

const SCHEDE = ["onboarding", "avatar_dolori", "offerta"] as const;

interface Invio {
  id: string;
  questionario_id: string;
}

interface StatoCliente {
  stato_onboarding: string;
  onboarding_completato_il: string | null;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "Solo il cliente può completare il proprio onboarding.");
    const admin = adminClient();

    // 1) Le 3 schede devono essere tutte inviate.
    const { data: inviiRaw, error: errInvii } = await admin
      .from("questionario_invii")
      .select("id, questionario_id")
      .eq("cliente_id", c.id)
      .eq("stato", "inviato");
    if (errInvii) {
      await logError("onboarding-completato:invii", errInvii, { cliente: c.id });
      throw new HttpError(500, "Non sono riuscito a leggere le schede. Riprova.");
    }
    const invii = (inviiRaw ?? []) as Invio[];
    const fatte = new Set(invii.map((i) => i.questionario_id));
    if (!SCHEDE.every((s) => fatte.has(s))) return json({ ok: true, completato: false });

    // 2) Profilo e ore operative dalle risposte dell'onboarding.
    const invioOnboarding = invii.find((i) => i.questionario_id === "onboarding");
    const { data: risposteRaw, error: errRisposte } = await admin
      .from("questionario_risposte")
      .select("domanda_id, ordine, valore")
      .eq("invio_id", invioOnboarding?.id ?? "");
    if (errRisposte) {
      await logError("onboarding-completato:risposte", errRisposte, { cliente: c.id });
      throw new HttpError(500, "Non sono riuscito a leggere le risposte. Riprova.");
    }
    const risultato = calcolaProfilo((risposteRaw ?? []) as RispostaOnboarding[]);

    // 3) Stato attuale: completato SOLO da nuovo/in_lavorazione (mai dagli stati finali).
    const { data: clienteRaw } = await admin
      .from("clienti")
      .select("stato_onboarding, onboarding_completato_il")
      .eq("id", c.id)
      .maybeSingle();
    const cliente = clienteRaw as StatoCliente | null;
    if (!cliente) throw new HttpError(404, "Cliente non trovato.");

    const cambiaStato = cliente.stato_onboarding === "nuovo" || cliente.stato_onboarding === "in_lavorazione";
    const patch: Record<string, unknown> = {
      profilo: risultato.profilo,
      ore_operative: risultato.oreOperative,
      onboarding_completato_il: cliente.onboarding_completato_il ?? new Date().toISOString(),
    };
    if (cambiaStato) patch.stato_onboarding = "completato";

    const { error: errUpdate } = await admin.from("clienti").update(patch).eq("id", c.id);
    if (errUpdate) {
      await logError("onboarding-completato:update", errUpdate, { cliente: c.id });
      throw new HttpError(500, "Non sono riuscito a salvare lo stato. Riprova.");
    }

    // 4) Telegram solo alla transizione: una volta per cliente.
    if (cambiaStato) {
      await notifyTelegram(
        `🎉 Onboarding completato 3/3!\nCliente: ${c.nombre || "(senza nome)"}\nEmail: ${c.email || "(senza email)"}\n👉 ${SITE_URL}/clienti/${c.id}`,
      );
    }
    return json({ ok: true, completato: true });
  } catch (err) {
    return gestisciErrore(err);
  }
});
