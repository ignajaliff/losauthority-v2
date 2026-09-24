import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediTeam } from "../_shared/supabase.ts";
import { logError } from "../_shared/log.ts";
import { fathomConfigurato, getFathomActionItems, getFathomSummary, traduciRiassunto } from "../_shared/fathom.ts";
import { scriviAzioni } from "../_shared/chiamate.ts";

/**
 * Scarica (o riscarica) il riassunto di una chiamata dall'API Fathom, lo traduce
 * in italiano con Aura e aggiorna `chiamate`. Le azioni vengono scritte solo se
 * la chiamata non ne aveva. Body: { chiamata_id }. Risposta: { ok, riassunto }.
 */

interface Body {
  chiamata_id?: string;
}

interface RigaChiamata {
  id: string;
  fathom_recording_id: string | null;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediTeam(req);
    const { chiamata_id } = await leggiBody<Body>(req);
    if (!chiamata_id || typeof chiamata_id !== "string") return errore("chiamata_id mancante", 400);
    if (!fathomConfigurato()) return errore("FATHOM_API_KEY non configurata", 500);

    const admin = adminClient();
    const { data, error } = await admin
      .from("chiamate")
      .select("id, fathom_recording_id")
      .eq("id", chiamata_id)
      .maybeSingle();
    if (error) {
      await logError("fathom-riassunto:lettura", error, { chiamata_id });
      return errore("Errore lettura chiamata. Riprova.", 500);
    }
    const chiamata = data as RigaChiamata | null;
    if (!chiamata) return errore("Chiamata non trovata.", 404);
    if (!chiamata.fathom_recording_id) {
      return errore("Questa call non ha una registrazione Fathom collegata.", 404);
    }
    const recordingId = chiamata.fathom_recording_id;

    const originale = await getFathomSummary(recordingId);
    if (!originale) {
      return errore("Fathom non ha (ancora) un riassunto per questa call. Riprova più tardi.", 404);
    }
    const riassunto = await traduciRiassunto(originale);

    const { error: eUp } = await admin
      .from("chiamate")
      .update({ riassunto, riassunto_originale: originale })
      .eq("id", chiamata_id);
    if (eUp) {
      await logError("fathom-riassunto:update", eUp, { chiamata_id });
      return errore("Non sono riuscito a salvare il riassunto. Riprova.", 500);
    }

    const azioni = await getFathomActionItems(recordingId);
    if (azioni.length > 0) {
      try {
        await scriviAzioni(admin, chiamata_id, azioni);
      } catch (err) {
        await logError("fathom-riassunto:azioni", err, { chiamata_id }, { silent: true });
      }
    }

    return json({ ok: true, riassunto });
  } catch (err) {
    return gestisciErrore(err);
  }
});
