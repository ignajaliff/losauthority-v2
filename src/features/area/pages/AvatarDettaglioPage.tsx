import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { CartaGirevole, FlussoAvatar, SceltaVista, useAvatar, useAvatars, useEliminaAvatar, useInviaAvatar, useMessaggiAvatar, type MessaggioAvatar, type VistaMobile } from "@/features/avatar";
import { ComposerAura } from "@/features/idee";
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
import { cn } from "@/lib/utils";

/**
 * /area/cervello/avatar/:id → a sinistra la conversazione con Aura, a destra la
 * carta d'identità che si compila man mano (e si gira per il dossier).
 */
export default function AvatarDettaglioPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { utente } = useAuth();
  const navigate = useNavigate();
  const clienteId = utente?.id ?? "";
  const [pendente, setPendente] = useState<{ testo: string; auraId: string | null } | null>(null);
  /** Testo da rimettere nel composer se l'invio fallisce: non si perde quello che il cliente ha scritto. */
  const [daRipristinare, setDaRipristinare] = useState<string | undefined>(undefined);
  const [confermaElimina, setConfermaElimina] = useState(false);
  /** Sul telefono si vede una cosa per volta; null = la sceglie lo stato (in costruzione → chat, completa → carta). */
  const [sceltaVista, setSceltaVista] = useState<VistaMobile | null>(null);

  const messaggi = useMessaggiAvatar(id);
  const lista = messaggi.data ?? [];
  const invia = useInviaAvatar(id, clienteId);
  const elimina = useEliminaAvatar(clienteId);
  const rispostaArrivata = pendente?.auraId != null && lista.some((m) => m.id === pendente.auraId);
  const pendenteVisibile = pendente !== null && !rispostaArrivata ? pendente : null;
  const auraScrive = pendenteVisibile !== null || invia.isPending || lista.some((m) => m.stato === "in_corso");
  const avatar = useAvatar(id, auraScrive);
  const tutti = useAvatars(utente?.id);
  const numero = Math.max((tutti.data?.findIndex((a) => a.id === id) ?? -1) + 1, 1);

  if (!id) return <Navigate to="/area/cervello/avatar" replace />;
  if (!utente) return null;
  if (avatar.isLoading) return <SkeletonBlocco altezza="h-96" />;
  if (avatar.isError) return <ErroreCaricamento />;
  const a = avatar.data;
  if (!a) {
    return (
      <div className="grid gap-6">
        <StatoVuoto titolo="Avatar non trovato" testo="Forse è stato eliminato." />
        <Link to="/area/cervello/avatar" className="text-sm underline underline-offset-4">
          Torna agli avatar
        </Link>
      </div>
    );
  }

  const completo = a.stato === "completo";
  const vista: VistaMobile = sceltaVista ?? (completo ? "carta" : "chat");
  const titolare = `${utente.nombre}${a.settore ? ` · ${a.settore}` : ""}`;

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
  function riprova(m: MessaggioAvatar) {
    setPendente({ testo: "", auraId: null });
    invia.mutate({ riprovaId: m.id }, { onSuccess: (r) => setPendente({ testo: "", auraId: r.messaggio_id }), onError: () => setPendente(null) });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/area/cervello/avatar" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-9">
          <ArrowLeft className="size-3.5" aria-hidden /> Avatar
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={completo ? "active" : "neutral"} dot>
            {completo ? "Avatar completo" : "In compilazione con Aura"}
          </Badge>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfermaElimina(true)}>
            <Trash2 aria-hidden /> Elimina
          </Button>
        </div>
      </div>

      <SceltaVista vista={vista} onCambia={setSceltaVista} />

      {/* grid-cols-1 + min-w-0: senza, la riga MRZ della carta allarga la colonna oltre lo schermo. */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(400px,480px)] lg:items-start">
        <section
          aria-label="Conversazione con Aura"
          className={cn(
            // Telefono: alta quanto lo schermo libero, così il campo per scrivere resta sempre a vista.
            "order-2 min-h-[360px] min-w-0 flex-col rounded-2xl border bg-card/70 h-[calc(100dvh-var(--header-h)-13.25rem)] md:h-auto md:min-h-[460px] lg:order-1 lg:h-[calc(100dvh-var(--header-h)-9rem)]",
            vista === "chat" ? "flex" : "hidden md:flex",
          )}
        >
          <header className="border-b px-4 py-3.5 md:px-5 md:py-4">
            <p className="eyebrow">Conversazione con Aura</p>
            <h2 className="text-[22px] leading-tight">{a.nome ? `Definiamo ${a.nome}` : "Definiamo il tuo cliente ideale"}</h2>
          </header>
          <div data-chat-scroll className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] md:p-5" aria-live="polite">
            {messaggi.isLoading ? <SkeletonBlocco altezza="h-40" /> : null}
            {messaggi.isError ? <ErroreCaricamento /> : null}
            {messaggi.data ? (
              <FlussoAvatar messaggi={lista} pendente={pendenteVisibile === null ? null : pendenteVisibile.testo} occupato={invia.isPending} onRiprova={riprova} />
            ) : null}
          </div>
          <div className="shrink-0 p-2 md:p-3">
            <ComposerAura
              inAttesa={auraScrive}
              onInvia={manda}
              suggerito={daRipristinare}
              onSuggeritoUsato={() => setDaRipristinare(undefined)}
              placeholder={completo ? "Vuoi correggere qualcosa? Dillo ad Aura…" : "Rispondi ad Aura…"}
            />
          </div>
        </section>

        <aside className={cn("order-1 min-w-0 lg:order-2", vista === "carta" ? "block" : "hidden md:block", "lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]")}>
          <CartaGirevole avatar={a} numero={numero} titolare={titolare} inCompilazione={!completo} />
        </aside>
      </div>

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo avatar?</AlertDialogTitle>
            <AlertDialogDescription>Si perdono la carta, il dossier e la conversazione con Aura. L'operazione non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => elimina.mutate(id, { onSuccess: () => navigate("/area/cervello/avatar", { replace: true }) })}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
