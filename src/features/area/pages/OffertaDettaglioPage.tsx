import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { FlussoAvatar } from "@/features/avatar";
import { ComposerAura } from "@/features/idee";
import {
  CartaOfferta,
  FASI_OFFERTA,
  linkPdfOfferta,
  useEliminaOfferta,
  useInviaOfferta,
  useMessaggiOfferta,
  useOfferta,
  useOfferte,
  type MessaggioOfferta,
} from "@/features/offerta";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";

/**
 * /area/cervello/offerta/:id → a sinistra la conversazione con Aura (che
 * propone, il cliente corregge), a destra la carta dell'offerta che si compila
 * man mano, con tutta la struttura sotto il titolo e "Scarica PDF" in fondo.
 */
export default function OffertaDettaglioPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { utente } = useAuth();
  const navigate = useNavigate();
  const clienteId = utente?.id ?? "";
  const [pendente, setPendente] = useState<{ testo: string; auraId: string | null } | null>(null);
  /** Testo da rimettere nel composer se l'invio fallisce: non si perde quello che il cliente ha scritto. */
  const [daRipristinare, setDaRipristinare] = useState<string | undefined>(undefined);
  const [confermaElimina, setConfermaElimina] = useState(false);

  const messaggi = useMessaggiOfferta(id);
  const lista = messaggi.data ?? [];
  const invia = useInviaOfferta(id, clienteId);
  const elimina = useEliminaOfferta(clienteId);
  const rispostaArrivata = pendente?.auraId != null && lista.some((m) => m.id === pendente.auraId);
  const pendenteVisibile = pendente !== null && !rispostaArrivata ? pendente : null;
  const auraScrive = pendenteVisibile !== null || invia.isPending || lista.some((m) => m.stato === "in_corso");
  const offerta = useOfferta(id, auraScrive);
  const tutte = useOfferte(utente?.id);
  const numero = Math.max((tutte.data?.findIndex((o) => o.id === id) ?? -1) + 1, 1);

  if (!id) return <Navigate to="/area/cervello/offerta" replace />;
  if (!utente) return null;
  if (offerta.isLoading) return <SkeletonBlocco altezza="h-96" />;
  if (offerta.isError) return <ErroreCaricamento />;
  const o = offerta.data;
  if (!o) {
    return (
      <div className="grid gap-6">
        <StatoVuoto titolo="Offerta non trovata" testo="Forse è stata eliminata." />
        <Link to="/area/cervello/offerta" className="text-sm underline underline-offset-4">
          Torna alle offerte
        </Link>
      </div>
    );
  }

  const completa = o.stato === "completo";

  function manda(testo: string) {
    setPendente({ testo, auraId: null });
    invia.mutate(
      { messaggio: testo },
      {
        onSuccess: (r) => setPendente({ testo, auraId: r.messaggio_id }),
        onError: () => {
          setPendente(null);
          setDaRipristinare(testo);
        },
      },
    );
  }
  function riprova(m: MessaggioOfferta) {
    setPendente({ testo: "", auraId: null });
    invia.mutate({ riprovaId: m.id }, { onSuccess: (r) => setPendente({ testo: "", auraId: r.messaggio_id }), onError: () => setPendente(null) });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/area/cervello/offerta" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden /> Offerta
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={completa ? "active" : "neutral"} dot>
            {completa ? "Offerta completa" : "In costruzione con Aura"}
          </Badge>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfermaElimina(true)}>
            <Trash2 aria-hidden /> Elimina
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-start">
        <section aria-label="Conversazione con Aura" className="order-2 flex min-h-[460px] flex-col rounded-2xl border bg-card/70 lg:order-1 lg:h-[calc(100dvh-var(--header-h)-9rem)]">
          <header className="border-b px-5 py-4">
            <p className="eyebrow">Conversazione con Aura</p>
            <h2 className="text-[22px] leading-tight">{o.nome ? `Rifiniamo «${o.nome}»` : "Costruiamo la tua offerta"}</h2>
          </header>
          <div data-chat-scroll className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]" aria-live="polite">
            {messaggi.isLoading ? <SkeletonBlocco altezza="h-40" /> : null}
            {messaggi.isError ? <ErroreCaricamento /> : null}
            {messaggi.data ? (
              <FlussoAvatar
                messaggi={lista}
                pendente={pendenteVisibile === null ? null : pendenteVisibile.testo}
                occupato={invia.isPending}
                onRiprova={riprova}
                fasi={FASI_OFFERTA}
              />
            ) : null}
          </div>
          <div className="shrink-0 p-3">
            <ComposerAura
              inAttesa={auraScrive}
              onInvia={manda}
              suggerito={daRipristinare}
              onSuggeritoUsato={() => setDaRipristinare(undefined)}
              placeholder={completa ? "Vuoi correggere qualcosa? Dillo ad Aura…" : "Rispondi ad Aura, o dille cosa cambieresti…"}
            />
          </div>
        </section>

        {/* La carta cresce con la struttura: resta appiccicata in alto e scorre da sola se è più alta dello schermo. */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:max-h-[calc(100dvh-var(--header-h)-3rem)] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
          <CartaOfferta offerta={o} numero={numero} titolare={utente.nombre} inCompilazione={!completa} linkPdf={linkPdfOfferta(o.id)} />
        </aside>
      </div>

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa offerta?</AlertDialogTitle>
            <AlertDialogDescription>Si perdono la carta, la struttura e la conversazione con Aura. L'operazione non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => elimina.mutate(id, { onSuccess: () => navigate("/area/cervello/offerta", { replace: true }) })}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
