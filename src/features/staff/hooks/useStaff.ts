import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ErroreEdge, invocaEdge, messaggioErrore } from "@/shared/utils/invocaEdge";
import { logDev } from "@/shared/utils/errors";
import type { CredenzialiStaff, MembroStaff, RuoloStaff } from "../types";
import type { NuovoStaffValues } from "../schema";

export const CHIAVI_STAFF = {
  lista: ["staff", "lista"] as const,
};

const RUOLI_TEAM_DB = ["admin", "staff", "staff_fatture"];

/** Errore restituito dalla Edge Function con un messaggio pensato per l'utente. */
export const ErroreGestioneUtenti = ErroreEdge;

interface RispostaGestioneUtenti {
  ok: boolean;
  id?: string;
  password?: string;
  error?: string;
}

type CorpoGestioneUtenti =
  | { azione: "crea_staff"; email: string; nombre: string; rol: RuoloStaff; password?: string }
  | { azione: "aggiorna_ruolo"; user_id: string; rol: RuoloStaff }
  | { azione: "reset_password"; user_id: string }
  | { azione: "elimina_utente"; user_id: string };

/** Chiama `gestione-utenti`; con { ok:false, error } (anche in 4xx) solleva ErroreGestioneUtenti. */
function invocaGestioneUtenti(body: CorpoGestioneUtenti): Promise<RispostaGestioneUtenti> {
  return invocaEdge<RispostaGestioneUtenti>("gestione-utenti", body);
}

function mostraErrore(titolo: string, error: unknown) {
  logDev(error);
  toast.error(titolo, {
    description: messaggioErrore(error),
  });
}

/** Team del gestionale: admin + staff, dal più anziano. */
export function useStaff() {
  return useQuery({
    queryKey: CHIAVI_STAFF.lista,
    queryFn: async (): Promise<MembroStaff[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, nombre, email, rol, created_at")
        .in("rol", RUOLI_TEAM_DB)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAggiornaRuoloStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { user_id: string; rol: RuoloStaff }) =>
      invocaGestioneUtenti({ azione: "aggiorna_ruolo", ...input }),
    onSuccess: () => {
      toast.success("Permessi aggiornati");
      void queryClient.invalidateQueries({ queryKey: CHIAVI_STAFF.lista });
    },
    onError: (error) => mostraErrore("Permessi non aggiornati", error),
  });
}

/** Genera una nuova password; la restituisce UNA volta (il chiamante la mostra). */
export function useResetPasswordStaff() {
  return useMutation({
    mutationFn: async (user_id: string): Promise<string> => {
      const r = await invocaGestioneUtenti({ azione: "reset_password", user_id });
      if (!r.password) throw new ErroreGestioneUtenti("Password non ricevuta.");
      return r.password;
    },
    onSuccess: () => toast.success("Password reimpostata"),
    onError: (error) => mostraErrore("Password non reimpostata", error),
  });
}

export function useRimuoviStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user_id: string) => invocaGestioneUtenti({ azione: "elimina_utente", user_id }),
    onSuccess: () => {
      toast.success("Collaboratore rimosso dal team");
      void queryClient.invalidateQueries({ queryKey: CHIAVI_STAFF.lista });
    },
    onError: (error) => mostraErrore("Collaboratore non rimosso", error),
  });
}

export function useCreaStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: NuovoStaffValues): Promise<CredenzialiStaff> => {
      const r = await invocaGestioneUtenti({
        azione: "crea_staff",
        email: values.email,
        nombre: values.nombre,
        rol: values.rol,
        ...(values.password ? { password: values.password } : {}),
      });
      const password = r.password ?? values.password;
      if (!password) throw new ErroreGestioneUtenti("Password non ricevuta.");
      return { nombre: values.nombre, email: values.email, password };
    },
    onSuccess: () => {
      toast.success("Staff creato");
      void queryClient.invalidateQueries({ queryKey: CHIAVI_STAFF.lista });
    },
    onError: (error) => mostraErrore("Staff non creato", error),
  });
}
