import { Skeleton } from "@/shared/components/ui/skeleton";

/** Skeleton standard per liste/tabelle (una riga per elemento atteso). */
export function SkeletonRighe({ righe = 5 }: { righe?: number }) {
  return (
    <div className="grid gap-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: righe }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** Skeleton per card/blocchi. */
export function SkeletonBlocco({ altezza = "h-48" }: { altezza?: string }) {
  return <Skeleton className={`${altezza} w-full`} />;
}

/** Stato di errore di lettura, coerente in tutto il progetto. */
export function ErroreCaricamento({ messaggio }: { messaggio?: string }) {
  return (
    <div role="alert" className="text-destructive text-sm">
      {messaggio ?? "Non è stato possibile caricare i dati. Prova a ricaricare la pagina."}
    </div>
  );
}

/** Stato vuoto. */
export function StatoVuoto({ titolo, testo }: { titolo: string; testo?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="font-medium">{titolo}</p>
      {testo ? <p className="mt-1 text-sm text-muted-foreground">{testo}</p> : null}
    </div>
  );
}
