import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { erroreMutation } from "@/shared/utils/invocaEdge";
import type { TablesInsert } from "@/integrations/supabase/types";
import type { CampoKit, ColoreBrand, FontBrand, KitBrand, KitBrandRiga, RuoloColore, RuoloFont } from "../types";

export const chiaviKit = {
  kit: (clienteId: string) => ["kit-brand", clienteId] as const,
  file: (path: string) => ["kit-brand", "file", path] as const,
};

/** Il kit del cliente: riga + colori + font + documenti, in una sola query. */
export function useKitBrand(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviKit.kit(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<KitBrand> => {
      const id = clienteId ?? "";
      const [kit, colori, font, documenti] = await Promise.all([
        supabase.from("kit_brand").select("*").eq("id", id).maybeSingle(),
        supabase.from("kit_brand_colori").select("*").eq("cliente_id", id).order("ordine").order("created_at"),
        supabase.from("kit_brand_font").select("*").eq("cliente_id", id).order("ordine").order("created_at"),
        supabase.from("kit_brand_documenti").select("*").eq("cliente_id", id).order("created_at"),
      ]);
      const errore = kit.error ?? colori.error ?? font.error ?? documenti.error;
      if (errore) throw errore;
      return { kit: kit.data, colori: colori.data ?? [], font: font.data ?? [], documenti: documenti.data ?? [] };
    },
  });
}

/** Un campo di testo della riga kit_brand (nome, payoff, tono, note): upsert, così la riga nasce al primo salvataggio. */
export function useSalvaCampoKit(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviKit.kit(clienteId);
  return useMutation({
    mutationFn: async ({ campo, valore }: { campo: CampoKit; valore: string }) => {
      const riga: TablesInsert<"kit_brand"> = { id: clienteId };
      riga[campo] = valore.trim() || null;
      const { error } = await supabase.from("kit_brand").upsert(riga, { onConflict: "id" });
      if (error) throw error;
    },
    onMutate: async ({ campo, valore }) => {
      await queryClient.cancelQueries({ queryKey: chiave });
      const prima = queryClient.getQueryData<KitBrand>(chiave);
      queryClient.setQueryData<KitBrand>(chiave, (k) => {
        if (!k) return k;
        const kit: KitBrandRiga = { ...(k.kit ?? rigaVuota(clienteId)) };
        kit[campo] = valore.trim() || null;
        return { ...k, kit };
      });
      return { prima };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prima) queryClient.setQueryData(chiave, ctx.prima);
      erroreMutation("Modifica non salvata")(e);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiave }),
  });
}

function rigaVuota(id: string): KitBrandRiga {
  const ora = new Date().toISOString();
  return { id, nome_brand: null, payoff: null, tono_voce: null, note: null, logo_path: null, logo_scuro_path: null, created_at: ora, updated_at: ora };
}

/** Nuovo colore in coda alla fascia. */
export function useAggiungiColore(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ hex, ordine }: { hex: string; ordine: number }) => {
      const { error } = await supabase.from("kit_brand_colori").insert({ cliente_id: clienteId, hex, ordine });
      if (error) throw error;
    },
    onError: erroreMutation("Colore non aggiunto"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}

/** Cambia hex, nome o ruolo di un colore (ottimista: la banda cambia subito). */
export function useAggiornaColore(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviKit.kit(clienteId);
  return useMutation({
    mutationFn: async ({ id, ...campi }: { id: string; hex?: string; nome?: string | null; ruolo?: RuoloColore }) => {
      const { error } = await supabase.from("kit_brand_colori").update(campi).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...campi }) => {
      await queryClient.cancelQueries({ queryKey: chiave });
      const prima = queryClient.getQueryData<KitBrand>(chiave);
      queryClient.setQueryData<KitBrand>(chiave, (k) => (k ? { ...k, colori: k.colori.map((c) => (c.id === id ? ({ ...c, ...campi } as ColoreBrand) : c)) } : k));
      return { prima };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prima) queryClient.setQueryData(chiave, ctx.prima);
      erroreMutation("Colore non aggiornato")(e);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiave }),
  });
}

export function useEliminaColore(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kit_brand_colori").delete().eq("id", id);
      if (error) throw error;
    },
    onError: erroreMutation("Colore non eliminato"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}

/** Nuovo font (solo nome e ruolo; il file si aggiunge dopo dal campione). */
export function useAggiungiFont(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nome, ruolo, ordine }: { nome: string; ruolo: RuoloFont; ordine: number }) => {
      const { error } = await supabase.from("kit_brand_font").insert({ cliente_id: clienteId, nome: nome.trim(), ruolo, ordine });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Font aggiunto"),
    onError: erroreMutation("Font non aggiunto"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}

export function useAggiornaFont(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviKit.kit(clienteId);
  return useMutation({
    mutationFn: async ({ id, ...campi }: { id: string; nome?: string; ruolo?: RuoloFont }) => {
      const { error } = await supabase.from("kit_brand_font").update(campi).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...campi }) => {
      await queryClient.cancelQueries({ queryKey: chiave });
      const prima = queryClient.getQueryData<KitBrand>(chiave);
      queryClient.setQueryData<KitBrand>(chiave, (k) => (k ? { ...k, font: k.font.map((f) => (f.id === id ? ({ ...f, ...campi } as FontBrand) : f)) } : k));
      return { prima };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prima) queryClient.setQueryData(chiave, ctx.prima);
      erroreMutation("Font non aggiornato")(e);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiave }),
  });
}

/** Descrizione di un documento (il nome resta quello del file). */
export function useAggiornaDocumento(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, descrizione }: { id: string; descrizione: string }) => {
      const { error } = await supabase.from("kit_brand_documenti").update({ descrizione: descrizione.trim() || null }).eq("id", id);
      if (error) throw error;
    },
    onError: erroreMutation("Descrizione non salvata"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviKit.kit(clienteId) }),
  });
}
