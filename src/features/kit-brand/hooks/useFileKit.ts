import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { logDev } from "@/shared/utils/errors";
import { erroreMutation, invocaFunzioneSicura } from "@/shared/utils/invocaEdge";
import { BUCKET_KIT, type DocumentoBrand, type FontBrand, estensione, mimeFont, motivoFileNonValido } from "../types";
import { chiaviKit } from "./useKitBrand";

/** Un'ora: i link firmati del logo e dei font si rinnovano da soli con la query. */
const SECONDI_LINK = 3600;

/** Link firmato di un file del bucket kit-brand (logo, font), rinnovato prima della scadenza. null = nessun file. */
export function useLinkFileKit(path: string | null | undefined) {
  return useQuery({
    queryKey: chiaviKit.file(path ?? ""),
    enabled: !!path,
    staleTime: (SECONDI_LINK - 300) * 1000,
    refetchInterval: (SECONDI_LINK - 300) * 1000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from(BUCKET_KIT).createSignedUrl(path ?? "", SECONDI_LINK);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

async function carica(clienteId: string, file: File, contentType: string): Promise<string> {
  const path = `${clienteId}/${crypto.randomUUID()}.${estensione(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET_KIT).upload(path, file, { contentType, upsert: false });
  if (error) throw error;
  return path;
}

async function rimuovi(path: string | null | undefined) {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET_KIT).remove([path]);
  if (error) logDev(error);
}

/** Logo (chiaro o per sfondo scuro): carica il file, aggiorna la riga, elimina il vecchio. `file: null` = togli il logo. */
export function useLogoKit(clienteId: string, campo: "logo_path" | "logo_scuro_path") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, vecchio }: { file: File | null; vecchio: string | null }) => {
      let path: string | null = null;
      if (file) {
        const motivo = motivoFileNonValido(file, "logo");
        if (motivo) throw new Error(motivo);
        path = await carica(clienteId, file, file.type);
      }
      const riga: TablesInsert<"kit_brand"> = { id: clienteId };
      riga[campo] = path;
      const { error } = await supabase.from("kit_brand").upsert(riga, { onConflict: "id" });
      if (error) {
        await rimuovi(path);
        throw error;
      }
      await rimuovi(vecchio);
    },
    onSuccess: (_, { file }) => toast.success(file ? "Logo aggiornato" : "Logo rimosso"),
    onError: erroreMutation("Logo non salvato"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}

/** File di un font (.ttf/.otf/.woff/.woff2) per l'anteprima vera; `file: null` = togli il file e resta il nome. */
export function useFileFont(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ font, file }: { font: FontBrand; file: File | null }) => {
      let path: string | null = null;
      if (file) {
        const motivo = motivoFileNonValido(file, "font");
        if (motivo) throw new Error(motivo);
        path = await carica(clienteId, file, mimeFont(file) ?? "font/ttf");
      }
      const { error } = await supabase.from("kit_brand_font").update({ storage_path: path }).eq("id", font.id);
      if (error) {
        await rimuovi(path);
        throw error;
      }
      await rimuovi(font.storage_path);
    },
    onSuccess: (_, { file }) => toast.success(file ? "File del font caricato" : "File del font rimosso"),
    onError: erroreMutation("File del font non salvato"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}

/** Elimina un font con il suo file. */
export function useEliminaFont(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (font: FontBrand) => {
      const { error } = await supabase.from("kit_brand_font").delete().eq("id", font.id);
      if (error) throw error;
      await rimuovi(font.storage_path);
    },
    onSuccess: () => toast.success("Font eliminato"),
    onError: erroreMutation("Font non eliminato"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}

/**
 * Nuovo documento del brand: upload + riga, poi chiede a `kit-brand-leggi` di
 * estrarre il testo per Aura (in background: se fallisce, lo riprende il cron).
 */
export function useCaricaDocumento(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviKit.kit(clienteId);
  return useMutation({
    mutationFn: async (file: File) => {
      const motivo = motivoFileNonValido(file, "documento");
      if (motivo) throw new Error(motivo);
      const path = await carica(clienteId, file, file.type);
      const { data, error } = await supabase
        .from("kit_brand_documenti")
        .insert({ cliente_id: clienteId, nome: file.name, storage_path: path, dimensione: file.size })
        .select("id")
        .single();
      if (error) {
        await rimuovi(path);
        throw error;
      }
      return data.id;
    },
    onSuccess: (id) => {
      toast.success("Documento caricato");
      void queryClient.invalidateQueries({ queryKey: chiave });
      // Lettura di Aura: non si aspetta, l'indice si aggiorna quando il testo c'è.
      void invocaFunzioneSicura("kit-brand-leggi", { documento_id: id }).then(() => queryClient.invalidateQueries({ queryKey: chiave }));
    },
    onError: erroreMutation("Documento non caricato"),
  });
}

export function useEliminaDocumento(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentoBrand) => {
      const { error } = await supabase.from("kit_brand_documenti").delete().eq("id", doc.id);
      if (error) throw error;
      await rimuovi(doc.storage_path);
    },
    onSuccess: () => toast.success("Documento eliminato"),
    onError: erroreMutation("Documento non eliminato"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}

/** Apre un documento in una scheda nuova con un link firmato di 60 secondi. */
export function useApriDocumento() {
  return useMutation({
    mutationFn: async (path: string) => {
      const { data, error } = await supabase.storage.from(BUCKET_KIT).createSignedUrl(path, 60);
      if (error) throw error;
      return data.signedUrl;
    },
    onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: erroreMutation("Impossibile aprire il documento"),
  });
}
