import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logDev } from "@/shared/utils/errors";
import { invocaEdge, messaggioErrore } from "../invocaEdge";
import type { CredenzialiCliente } from "../types";
import { chiaviClienti } from "./chiavi";

/* Tutte le operazioni sull'account passano dalla Edge Function `gestione-utenti`. */

interface RispostaCreazione {
  ok: true;
  id?: string;
  password?: string;
}

export interface NuovoClienteInput {
  nombre: string;
  email: string;
  password?: string;
  telefono?: string;
  tag_ids: string[];
}

export function useCreaCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NuovoClienteInput): Promise<CredenzialiCliente> => {
      const r = await invocaEdge<RispostaCreazione>("gestione-utenti", {
        azione: "crea_cliente",
        email: input.email,
        nombre: input.nombre,
        password: input.password || undefined,
        telefono: input.telefono || undefined,
        tag_ids: input.tag_ids,
      });
      return {
        id: r.id ?? "",
        email: input.email,
        nombre: input.nombre,
        password: r.password ?? input.password ?? "",
      };
    },
    onSuccess: () => {
      toast.success("Cliente creato");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
    },
    onError: (error) => {
      toast.error("Cliente non creato", { description: messaggioErrore(error) });
      logDev(error);
    },
  });
}

interface RispostaReset {
  ok: true;
  password?: string;
}

/** Nuova password generata dal server: si mostra una volta sola. */
export function useResetPassword(userId: string) {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const r = await invocaEdge<RispostaReset>("gestione-utenti", { azione: "reset_password", user_id: userId });
      if (!r.password) throw new Error("password mancante nella risposta");
      return r.password;
    },
    onSuccess: () => toast.success("Password reimpostata"),
    onError: (error) => {
      toast.error("Password non reimpostata", { description: messaggioErrore(error) });
      logDev(error);
    },
  });
}

/** Elimina account e dati del cliente (solo admin). Chi lo usa decide dove navigare. */
export function useEliminaCliente(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => invocaEdge<{ ok: true }>("gestione-utenti", { azione: "elimina_utente", user_id: userId }),
    onSuccess: () => {
      toast.success("Cliente eliminato");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
    },
    onError: (error) => {
      toast.error("Cliente non eliminato", { description: messaggioErrore(error) });
      logDev(error);
    },
  });
}
