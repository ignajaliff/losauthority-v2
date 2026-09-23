import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "../hooks/useAuth";
import { esTeam, type Rol } from "../types";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Ruoli ammessi. Se omesso basta essere loggati. */
  requiredRole?: Rol[];
}

/** Home per ruolo: il team va al gestionale, il cliente alla sua area. */
export function homePerRuolo(rol: Rol | null): string {
  return esTeam(rol) ? "/dashboard" : "/area";
}

/**
 * RBAC lato frontend (UX). La sicurezza vera è la RLS in Supabase.
 * Non loggato → /auth/login (con ritorno). Ruolo sbagliato → home del proprio ruolo.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, utente, caricamento } = useAuth();
  const location = useLocation();

  if (caricamento) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  // Sessione valida ma profilo non ancora caricato o mancante: non lasciare la pagina in bianco.
  if (!utente) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  if (requiredRole && !requiredRole.includes(utente.rol)) {
    return <Navigate to={homePerRuolo(utente.rol)} replace />;
  }

  return <>{children}</>;
}
