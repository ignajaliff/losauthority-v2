import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { useStatoScheda } from "@/features/scheda";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

/**
 * Lo spazio cliente (Dashboard, Workflow, Avatar, Offerta) si apre solo dopo
 * l'invio della scheda onboarding: altrimenti si torna a /area.
 * Mentre lo stato viene ricontrollato non si decide nulla, per non rimbalzare.
 */
export function GatePercorso({ children }: { children: ReactNode }) {
  const { utente } = useAuth();
  const { data, isLoading, isFetching, isError } = useStatoScheda(utente?.id);

  if (!utente || isLoading || (isFetching && data?.stato !== "inviato")) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <SkeletonBlocco altezza="h-48" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mx-auto max-w-[820px] p-6">
        <ErroreCaricamento />
      </div>
    );
  }
  if (data?.stato !== "inviato") return <Navigate to="/area" replace />;
  return <>{children}</>;
}
