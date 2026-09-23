import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, RUOLI_FINANCE, RUOLI_TEAM, homePerRuolo, useAuth } from "@/features/auth";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ClientShell } from "@/shared/components/layout/ClientShell";
import { SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

// Pagine caricate in lazy: una per modulo (rules.txt · Performance).
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const PipelinePage = lazy(() => import("@/features/pipeline/pages/PipelinePage"));
const ClientiPage = lazy(() => import("@/features/clienti/pages/ClientiPage"));
const NuovoClientePage = lazy(() => import("@/features/clienti/pages/NuovoClientePage"));
const SchedaClientePage = lazy(() => import("@/features/clienti/pages/SchedaClientePage"));
const OnboardingPage = lazy(() => import("@/features/onboarding/pages/OnboardingPage"));
const OnboardingDettaglioPage = lazy(() => import("@/features/onboarding/pages/OnboardingDettaglioPage"));
const FinancePage = lazy(() => import("@/features/finance/pages/FinancePage"));
const LezioniPage = lazy(() => import("@/features/lezioni/pages/LezioniPage"));
const StaffPage = lazy(() => import("@/features/staff/pages/StaffPage"));
const NuovoStaffPage = lazy(() => import("@/features/staff/pages/NuovoStaffPage"));
const TagPage = lazy(() => import("@/features/tag/pages/TagPage"));
const ErroriPage = lazy(() => import("@/features/errori/pages/ErroriPage"));
const AreaPage = lazy(() => import("@/features/area/pages/AreaPage"));
const SchedaPage = lazy(() => import("@/features/area/pages/SchedaPage"));

function Attesa({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SkeletonBlocco />}>{children}</Suspense>;
}

function RedirectHome() {
  const { session, utente, caricamento } = useAuth();
  if (caricamento) return <SkeletonBlocco />;
  if (!session) return <Navigate to="/auth/login" replace />;
  return <Navigate to={homePerRuolo(utente?.rol ?? null)} replace />;
}

export function AppRoutes() {
  return (
    <Attesa>
      <Routes>
        <Route path="/" element={<RedirectHome />} />
        <Route path="/auth/login" element={<LoginPage />} />
        {/* Compatibilità col vecchio sito: /login → /auth/login */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />

        {/* Gestionale: team */}
        <Route
          element={
            <ProtectedRoute requiredRole={RUOLI_TEAM}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/clienti" element={<ClientiPage />} />
          <Route path="/clienti/nuovo" element={<NuovoClientePage />} />
          <Route path="/clienti/:id" element={<SchedaClientePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/:id" element={<OnboardingDettaglioPage />} />
          <Route path="/tag" element={<TagPage />} />
          <Route path="/errori" element={<ErroriPage />} />
          <Route
            path="/finance"
            element={
              <ProtectedRoute requiredRole={RUOLI_FINANCE}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lezioni"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <LezioniPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <StaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/nuovo"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <NuovoStaffPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Area cliente */}
        <Route
          element={
            <ProtectedRoute requiredRole={["cliente"]}>
              <ClientShell />
            </ProtectedRoute>
          }
        >
          <Route path="/area" element={<AreaPage />} />
          <Route path="/area/:slug" element={<SchedaPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Attesa>
  );
}
