import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { FileOnboarding } from "../types";
import { chiaviScheda } from "../mappa";

export const BUCKET_MATERIALI = "materiali";
export const DIMENSIONE_MAX_ALLEGATO = 25 * 1024 * 1024;
const MIME_CONSENTITI = ["application/pdf", "image/jpeg", "image/png", "image/webp", "video/mp4", "text/plain"];

/** Motivo per cui un file non può essere caricato, o null se va bene. */
export function motivoFileNonValido(file: File): string | null {
  if (file.size > DIMENSIONE_MAX_ALLEGATO) return `"${file.name}" supera i 25 MB.`;
  if (!MIME_CONSENTITI.includes(file.type)) return `"${file.name}": sono ammessi PDF, immagini, video mp4 e testo.`;
  return null;
}

function estensione(nome: string): string {
  const punto = nome.lastIndexOf(".");
  const ext = punto >= 0 ? nome.slice(punto + 1).toLowerCase() : "";
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
}

/** File della sezione Materiali di un cliente (files_onboarding.onboarding_id = id cliente). */
export function useFilesOnboarding(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviScheda.files(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<FileOnboarding[]> => {
      const { data, error } = await supabase
        .from("files_onboarding")
        .select("*")
        .eq("onboarding_id", clienteId ?? "")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Upload su materiali/{cliente}/{uuid}.{ext} + riga in files_onboarding. */
export function useCaricaFile(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const motivo = motivoFileNonValido(file);
      if (motivo) throw new Error(motivo);
      const path = `${clienteId}/${crypto.randomUUID()}.${estensione(file.name)}`;
      const { error: erroreUpload } = await supabase.storage
        .from(BUCKET_MATERIALI)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (erroreUpload) throw erroreUpload;
      const { error } = await supabase.from("files_onboarding").insert({
        onboarding_id: clienteId,
        nome: file.name,
        dimensione: file.size,
        storage_path: path,
      });
      if (error) {
        await supabase.storage.from(BUCKET_MATERIALI).remove([path]);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("File caricato.");
      void queryClient.invalidateQueries({ queryKey: chiaviScheda.files(clienteId) });
    },
    onError: (error) => {
      toast.error("Caricamento non riuscito", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Elimina file dal bucket e riga dalla tabella. */
export function useEliminaFile(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: FileOnboarding) => {
      const { error: erroreStorage } = await supabase.storage.from(BUCKET_MATERIALI).remove([file.storage_path]);
      if (erroreStorage) throw erroreStorage;
      const { error } = await supabase.from("files_onboarding").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("File eliminato.");
      void queryClient.invalidateQueries({ queryKey: chiaviScheda.files(clienteId) });
    },
    onError: (error) => {
      toast.error("Eliminazione non riuscita", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Link firmato (60 s) per aprire un file: si genera al click. */
export function useApriFile() {
  return useMutation({
    mutationFn: async (storagePath: string) => {
      const { data, error } = await supabase.storage.from(BUCKET_MATERIALI).createSignedUrl(storagePath, 60);
      if (error) throw error;
      return data.signedUrl;
    },
    onSuccess: (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (error) => {
      toast.error("Impossibile aprire il file", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
