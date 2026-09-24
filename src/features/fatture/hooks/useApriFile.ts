import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";

interface ApriFileInput {
  bucket: string;
  path: string;
}

/**
 * Apre in una nuova scheda un file di un bucket privato tramite URL firmato (60 s).
 * La finestra viene aperta subito (prima dell'await) per non farsi bloccare dai popup blocker.
 */
export function useApriFile() {
  return useMutation({
    mutationFn: async ({ bucket, path }: ApriFileInput) => {
      const finestra = window.open("", "_blank");
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
      if (error || !data?.signedUrl) {
        finestra?.close();
        throw error ?? new Error("URL firmato non disponibile");
      }
      if (finestra) finestra.location.href = data.signedUrl;
      else window.open(data.signedUrl, "_blank", "noopener");
    },
    onError: (error) => {
      toast.error("Non riesco ad aprire il file", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
