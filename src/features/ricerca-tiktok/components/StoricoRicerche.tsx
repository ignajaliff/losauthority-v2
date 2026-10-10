import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useEliminaRicerca } from "../hooks/useRicerche";
import { eInCorso, eliminabile, type RicercaTiktok } from "../types";

interface StoricoRicercheProps {
  clienteId: string;
  ricerche: RicercaTiktok[];
  selezionataId: string | null;
  onApri: (id: string) => void;
  onEliminata: (id: string) => void;
}

function BadgeStato({ r }: { r: RicercaTiktok }) {
  if (eInCorso(r)) return <Badge variant="expiring" dot>In corso</Badge>;
  if (r.stato === "errore") return <Badge variant="churn">Non riuscita</Badge>;
  return <Badge variant="neutral">{r.recenti ?? 0} recenti</Badge>;
}

/** Le ricerche fatte: si aprono, e si eliminano solo quelle in errore o più vecchie di 15 giorni. */
export function StoricoRicerche({ clienteId, ricerche, selezionataId, onApri, onEliminata }: StoricoRicercheProps) {
  const elimina = useEliminaRicerca(clienteId);
  const [daEliminare, setDaEliminare] = useState<RicercaTiktok | null>(null);
  const [adesso] = useState(() => new Date());

  return (
    <nav aria-label="Ricerche fatte" className="grid gap-2">
      <p className="eyebrow px-1">Le tue ricerche</p>
      {/* Sul telefono, con più ricerche, una striscia che scorre di lato: impilate spingerebbero i risultati in fondo. */}
      <ul
        className={cn(
          "flex flex-wrap gap-2",
          ricerche.length > 1 && "max-sm:-mx-4 max-sm:snap-x max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:scroll-px-4 max-sm:px-4 max-sm:pb-1",
        )}
      >
        {ricerche.map((r) => (
          <li key={r.id} className={cn("group relative w-full sm:w-64", ricerche.length > 1 && "max-sm:w-[82%] max-sm:shrink-0 max-sm:snap-start")}>
            <button
              type="button"
              onClick={() => onApri(r.id)}
              aria-current={r.id === selezionataId ? "true" : undefined}
              className={cn(
                "grid w-full gap-1 rounded-lg border px-3 py-2.5 pr-10 text-left transition-colors",
                r.id === selezionataId ? "border-foreground bg-muted" : "bg-card hover:border-input",
              )}
            >
              <span className="line-clamp-2 text-sm font-medium">{r.tema}</span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {format(new Date(r.created_at), "d MMM yyyy", { locale: it })}
                <BadgeStato r={r} />
              </span>
            </button>
            {eliminabile(r, adesso) ? (
              <Button
                size="icon-sm"
                variant="ghost"
                className="absolute top-2 right-1.5 text-muted-foreground"
                aria-label={`Elimina la ricerca ${r.tema}`}
                onClick={() => setDaEliminare(r)}
              >
                <Trash2 aria-hidden />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <AlertDialog open={daEliminare !== null} onOpenChange={(open) => (open ? null : setDaEliminare(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la ricerca?</AlertDialogTitle>
            <AlertDialogDescription>«{daEliminare?.tema}» e i suoi video spariscono. Le idee e i contenuti che ne hai tratto restano.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elimina.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => {
                if (!daEliminare) return;
                const id = daEliminare.id;
                elimina.mutate(id, { onSuccess: () => { setDaEliminare(null); onEliminata(id); } });
              }}
            >
              {elimina.isPending ? "Elimino…" : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
