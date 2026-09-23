import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logDev } from "@/shared/utils/errors";
import type { Rol, UtenteCorrente } from "../types";

interface AuthContextValue {
  session: Session | null;
  utente: UtenteCorrente | null;
  /** true finché non sappiamo se c'è una sessione e quale ruolo ha. */
  caricamento: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function caricaUtente(session: Session): Promise<UtenteCorrente | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id, email, nombre, rol")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error) {
    logDev(error);
    return null;
  }
  if (!data) return null;
  return { id: data.id, email: data.email, nombre: data.nombre, rol: data.rol as Rol };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [utente, setUtente] = useState<UtenteCorrente | null>(null);
  const [caricamento, setCaricamento] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let attivo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!attivo) return;
      setSession(data.session);
      setUtente(data.session ? await caricaUtente(data.session) : null);
      setCaricamento(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, nuovaSessione) => {
      if (!attivo) return;
      setSession(nuovaSessione);
      if (evento === "SIGNED_OUT" || !nuovaSessione) {
        setUtente(null);
        queryClient.clear();
        return;
      }
      if (evento === "SIGNED_IN" || evento === "USER_UPDATED" || evento === "TOKEN_REFRESHED") {
        // setTimeout: mai chiamare Supabase dentro il callback di onAuthStateChange (deadlock).
        setTimeout(() => {
          void caricaUtente(nuovaSessione).then((u) => {
            if (attivo) setUtente(u);
          });
        }, 0);
      }
    });

    return () => {
      attivo = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUtente(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ session, utente, caricamento, signOut }),
    [session, utente, caricamento, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth va usato dentro <AuthProvider>");
  return ctx;
}
