import { Checkbox } from "@/shared/components/ui/checkbox";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { useAzioniChiamata, useToggleAzioneChiamata } from "../hooks/useChiamate";

/** Action items della call con spunta "completata". */
export function AzioniChiamata({ chiamataId, modificabile }: { chiamataId: string; modificabile: boolean }) {
  const { data: azioni, isLoading, isError } = useAzioniChiamata(chiamataId);
  const toggle = useToggleAzioneChiamata(chiamataId);

  if (isLoading) return <SkeletonRighe righe={2} />;
  if (isError) return <ErroreCaricamento messaggio="Non è stato possibile caricare le azioni." />;
  if (!azioni || azioni.length === 0) return null;

  const fatte = azioni.filter((a) => a.completata).length;

  return (
    <section aria-label="Azioni della call" className="grid gap-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Azioni · {fatte}/{azioni.length}
      </p>
      <ul className="grid gap-1.5">
        {azioni.map((a) => {
          const id = `azione-${a.id}`;
          return (
            <li key={a.id} className="flex items-start gap-2">
              <Checkbox
                id={id}
                checked={a.completata}
                disabled={!modificabile || toggle.isPending}
                onCheckedChange={(checked) => toggle.mutate({ id: a.id, completata: checked })}
                className="mt-0.5"
              />
              <label
                htmlFor={id}
                className={`text-sm leading-snug ${a.completata ? "text-muted-foreground line-through" : ""}`}
              >
                {a.testo}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
