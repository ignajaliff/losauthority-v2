import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import { formatDateTime } from "@/shared/utils/formatDate";
import { useRigeneraPiano } from "../hooks/useChiamate";
import { type Chiamata, pianoInLavorazione } from "../types";

/** Riga di stato per ogni valore di `piano_stato` (null = la call non è ancora in coda). */
function Stato({ chiamata }: { chiamata: Chiamata }) {
  const s = chiamata.piano_stato;
  if (pianoInLavorazione(s)) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Aura sta scrivendo il piano d'azione… (circa un minuto)
      </p>
    );
  }
  if (s === "pronto") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="active" dot>
          Piano d'azione scritto da Aura
        </Badge>
        <span className="text-muted-foreground">
          {chiamata.piano_generato_il ? `il ${formatDateTime(chiamata.piano_generato_il)} · ` : ""}lo trovi in Panoramica
        </span>
      </div>
    );
  }
  if (s === "errore" || s === "saltato") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={s === "errore" ? "churn" : "neutral"} dot>
          {s === "errore" ? "Piano non scritto" : "Call senza piano"}
        </Badge>
        {chiamata.piano_errore ? <span className="min-w-0 break-words text-muted-foreground">{chiamata.piano_errore}</span> : null}
      </div>
    );
  }
  const pronta = !!chiamata.cliente_id && (!!chiamata.riassunto || !!chiamata.trascrizione);
  return (
    <p className="text-sm text-muted-foreground">
      {!chiamata.cliente_id
        ? "Assegna la call a un cliente: Aura scriverà il suo piano d'azione."
        : pronta
          ? "Piano d'azione non ancora scritto da questa call: usa il bottone qui accanto."
          : "Il piano d'azione lo scrive Aura da sola appena la call ha il riassunto."}
    </p>
  );
}

/**
 * Il piano d'azione che Aura scrive da questa call (parte da solo: trigger del
 * database → Edge Function `aura-compiti`). Qui il team vede a che punto è e,
 * se serve, lo fa riscrivere: «Rigenera» sostituisce le tappe di Aura, non quelle del team.
 */
export function StatoPianoChiamata({ chiamata }: { chiamata: Chiamata }) {
  const [conferma, setConferma] = useState(false);
  const rigenera = useRigeneraPiano(chiamata.cliente_id);
  const occupato = rigenera.isPending || pianoInLavorazione(chiamata.piano_stato);
  const pronta = !!chiamata.cliente_id && (!!chiamata.riassunto || !!chiamata.trascrizione);
  const etichetta = chiamata.piano_stato === "pronto" || chiamata.piano_stato === "saltato" ? "Rigenera il piano con Aura" : chiamata.piano_stato === "errore" ? "Riprova con Aura" : "Scrivi il piano con Aura";

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <Stato chiamata={chiamata} />
      <Button type="button" variant="secondary" size="sm" disabled={occupato || !pronta} onClick={() => setConferma(true)}>
        {rigenera.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />} {etichetta}
      </Button>

      <AlertDialog open={conferma} onOpenChange={setConferma}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Far riscrivere il piano ad Aura?</AlertDialogTitle>
            <AlertDialogDescription>
              Aura rilegge questa call e scrive il piano d'azione del cliente. Le tappe già scritte da Aura vengono sostituite (anche
              quelle spuntate); restano le tappe del team e le tappe di Aura in cui il team ha aggiunto sotto-compiti suoi. Ci vuole
              circa un minuto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConferma(false);
                rigenera.mutate({ chiamataId: chiamata.id });
              }}
            >
              <Sparkles /> Scrivi il piano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
