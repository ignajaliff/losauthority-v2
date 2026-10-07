import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ProtectedRoute, RUOLI_FINANCE, RUOLI_TEAM, homePerRuolo, useAuth } from "@/features/auth";
import { GatePercorso } from "@/features/area";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ClientShell } from "@/shared/components/layout/ClientShell";
import { CaricamentoPagina } from "@/shared/components/layout/ContenutoPagina";
import { SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

// Pagine caricate in lazy: una per modulo (rules.txt · Performance).
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const PipelinePage = lazy(() => import("@/features/pipeline/pages/PipelinePage"));
const ClientiPage = lazy(() => import("@/features/clienti/pages/ClientiPage"));
const NuovoClientePage = lazy(() => import("@/features/clienti/pages/NuovoClientePage"));
const SchedaClientePage = lazy(() => import("@/features/clienti/pages/SchedaClientePage"));
const FinancePage = lazy(() => import("@/features/finance/pages/FinancePage"));
const LezioniPage = lazy(() => import("@/features/lezioni/pages/LezioniPage"));
const StaffPage = lazy(() => import("@/features/staff/pages/StaffPage"));
const NuovoStaffPage = lazy(() => import("@/features/staff/pages/NuovoStaffPage"));
const TagPage = lazy(() => import("@/features/tag/pages/TagPage"));
const ErroriPage = lazy(() => import("@/features/errori/pages/ErroriPage"));
const AreaPage = lazy(() => import("@/features/area/pages/AreaPage"));
const SchedaPage = lazy(() => import("@/features/area/pages/SchedaPage"));
const DashboardClientePage = lazy(() => import("@/features/area/pages/DashboardClientePage"));
const WorkflowPage = lazy(() => import("@/features/area/pages/WorkflowPage"));
const PubblicazioniPage = lazy(() => import("@/features/area/pages/PubblicazioniPage"));
const StiliPage = lazy(() => import("@/features/area/pages/StiliPage"));
const CreaIdeePage = lazy(() => import("@/features/area/pages/CreaIdeePage"));
const RicercaTiktokPage = lazy(() => import("@/features/area/pages/RicercaTiktokPage"));
const WesleyCoachPage = lazy(() => import("@/features/area/pages/WesleyCoachPage"));
const CervelloPage = lazy(() => import("@/features/area/pages/CervelloPage"));
const AvatarPage = lazy(() => import("@/features/area/pages/AvatarPage"));
const AvatarDettaglioPage = lazy(() => import("@/features/area/pages/AvatarDettaglioPage"));
const ContrattiPage = lazy(() => import("@/features/contratti/pages/ContrattiPage"));
const NuovoInvitoPage = lazy(() => import("@/features/contratti/pages/NuovoInvitoPage"));
const ContrattoDettaglioPage = lazy(() => import("@/features/contratti/pages/ContrattoDettaglioPage"));
const OffertePage = lazy(() => import("@/features/contratti/pages/OffertePage"));
const ContrattoPubblicoPage = lazy(() => import("@/features/contratti/pages/ContrattoPubblicoPage"));
const InformativaPrivacyPage = lazy(() => import("@/features/contratti/pages/InformativaPrivacyPage"));
const OffertaPage = lazy(() => import("@/features/area/pages/OffertaPage"));
const OffertaDettaglioPage = lazy(() => import("@/features/area/pages/OffertaDettaglioPage"));
const OffertaStampaPage = lazy(() => import("@/features/area/pages/OffertaStampaPage"));
const ConcorrentiPage = lazy(() => import("@/features/area/pages/ConcorrentiPage"));
const ClientiAreaPage = lazy(() => import("@/features/area/pages/ClientiAreaPage"));
const KitBrandPage = lazy(() => import("@/features/area/pages/KitBrandPage"));

function Attesa({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<CaricamentoPagina />}>{children}</Suspense>;
}

/** Link vecchi (Telegram, segnalibri) /onboarding/:id → scheda cliente, tab Onboarding. */
function RedirectOnboarding() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/clienti/${id}?tab=onboarding` : "/clienti"} replace />;
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
        {/* Pubbliche, senza login: il contratto del cliente (la chiave è il token del link) e l'informativa privacy */}
        <Route path="/contratto/:token" element={<ContrattoPubblicoPage />} />
        <Route path="/informativa-privacy" element={<InformativaPrivacyPage />} />

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
          {/* Il vecchio /onboarding ora vive nel tab Onboarding della scheda cliente. */}
          <Route path="/onboarding" element={<Navigate to="/clienti" replace />} />
          <Route path="/onboarding/:id" element={<RedirectOnboarding />} />
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
          {/* Modulo Offerte e Contratti: legge chi vede i soldi; inviti e offerte solo l'admin */}
          <Route
            path="/contratti"
            element={
              <ProtectedRoute requiredRole={RUOLI_FINANCE}>
                <ContrattiPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contratti/nuovo"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <NuovoInvitoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contratti/:id"
            element={
              <ProtectedRoute requiredRole={RUOLI_FINANCE}>
                <ContrattoDettaglioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offerte"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <OffertePage />
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
          <Route path="/area/onboarding" element={<SchedaPage />} />
        </Route>

        {/* Spazio cliente: si apre dopo l'invio della scheda onboarding, navigazione in alto */}
        <Route
          element={
            <ProtectedRoute requiredRole={["cliente"]}>
              <GatePercorso>
                <ClientShell conNav />
              </GatePercorso>
            </ProtectedRoute>
          }
        >
          <Route path="/area/dashboard" element={<DashboardClientePage />} />
          <Route path="/area/workflow" element={<WorkflowPage />} />
          <Route path="/area/pubblicazioni" element={<PubblicazioniPage />} />
          <Route path="/area/clienti" element={<ClientiAreaPage />} />
          <Route path="/area/stili" element={<StiliPage />} />
          <Route path="/area/crea-idee" element={<CreaIdeePage />} />
          <Route path="/area/crea-idee/ricerca-tiktok" element={<RicercaTiktokPage />} />
          <Route path="/area/coach" element={<WesleyCoachPage />} />
          {/* Cervello del tuo branding: mappa + quattro sottopagine (i link vecchi /area/avatar e /area/offerta rimandano qui) */}
          <Route path="/area/cervello" element={<CervelloPage />} />
          <Route path="/area/cervello/avatar" element={<AvatarPage />} />
          <Route path="/area/cervello/avatar/:id" element={<AvatarDettaglioPage />} />
          <Route path="/area/cervello/offerta" element={<OffertaPage />} />
          <Route path="/area/cervello/offerta/:id" element={<OffertaDettaglioPage />} />
          <Route path="/area/cervello/concorrenti" element={<ConcorrentiPage />} />
          <Route path="/area/cervello/clienti" element={<Navigate to="/area/cervello/concorrenti" replace />} />
          <Route path="/area/cervello/kit-brand" element={<KitBrandPage />} />
          <Route path="/area/avatar" element={<Navigate to="/area/cervello/avatar" replace />} />
          <Route path="/area/offerta" element={<Navigate to="/area/cervello/offerta" replace />} />
        </Route>

        {/* Vista di stampa dell'offerta: fuori dalle shell (niente sidebar né header), così window.print stampa solo il documento. Cliente e team. */}
        <Route
          path="/stampa/offerta/:id"
          element={
            <ProtectedRoute requiredRole={["cliente", ...RUOLI_TEAM]}>
              <OffertaStampaPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Attesa>
  );
}
