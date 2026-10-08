/**
 * onboarding-completato — chiamata dal cliente dopo l'invio della scheda.
 * Se `data_onboarding.stato = 'inviato'`: calcola profilo/ore_operative, segna
 * il cliente come completato (solo da nuovo/in_lavorazione) e avvisa su
 * Telegram UNA sola volta (alla transizione di stato).
 */
import { gestisciErrore, HttpError, json, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { logError } from "../_shared/log.ts";
import { rigaLink, sitoGestionale } from "../_shared/sito.ts";
import { instagramDaLink } from "../_shared/instagram.ts";
import { calcolaProfilo, type RigaOnboarding } from "./profilo.ts";

interface StatoCliente {
  stato_onboarding: string;
  onboarding_completato_il: string | null;
  instagram: string | null;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "Solo il cliente può completare il proprio onboarding.");
    const admin = adminClient();

    // 1) La scheda deve essere inviata (una riga per cliente, id = id cliente).
    const { data: rigaRaw, error: errRiga } = await admin.from("data_onboarding").select("*").eq("id", c.id).maybeSingle();
    if (errRiga) {
      await logError("onboarding-completato:scheda", errRiga, { cliente: c.id });
      throw new HttpError(500, "Non sono riuscito a leggere la scheda. Riprova.");
    }
    const riga = rigaRaw as (RigaOnboarding & { stato: string }) | null;
    if (!riga || riga.stato !== "inviato") return json({ ok: true, completato: false });

    // 2) Profilo e ore operative dalle colonne delle ore.
    const risultato = calcolaProfilo(riga);

    // 3) Stato attuale: completato SOLO da nuovo/in_lavorazione (mai dagli stati finali).
    const { data: clienteRaw } = await admin
      .from("clienti")
      .select("stato_onboarding, onboarding_completato_il, instagram")
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
    // Profilo Instagram dai link della scheda (C1), una volta sola: poi lo legge instagram-sync.
    if (!cliente.instagram) {
      const instagram = instagramDaLink((riga as Record<string, unknown>).link_profili);
      if (instagram) patch.instagram = instagram;
    }

    const { error: errUpdate } = await admin.from("clienti").update(patch).eq("id", c.id);
    if (errUpdate) {
      await logError("onboarding-completato:update", errUpdate, { cliente: c.id });
      throw new HttpError(500, "Non sono riuscito a salvare lo stato. Riprova.");
    }

    // 4) Telegram solo alla transizione: una volta per cliente.
    if (cambiaStato) {
      const sito = await sitoGestionale(admin);
      await notifyTelegram(
        `🎉 Onboarding completato!\nCliente: ${c.nombre || "(senza nome)"}\nEmail: ${c.email || "(senza email)"}` +
          rigaLink(sito, `/clienti/${c.id}?tab=onboarding`),
      );
    }
    return json({ ok: true, completato: true });
  } catch (err) {
    return gestisciErrore(err);
  }
});
