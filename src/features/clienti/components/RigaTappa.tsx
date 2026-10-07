import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { formatDate } from "@/shared/utils/formatDate";
import { avanzamento, eFatto } from "../compiti";
import type { Compito, StatoCompito, Tappa } from "../types";
import { NuovoCompitoDialog } from "./NuovoCompitoDialog";

interface AzioniCompito {
  onCambia: (id: string, stato: StatoCompito) => void;
  onElimina: (id: string) => void;
  disabilitato: boolean;
}

function RigaSottoCompito({ compito, onCambia, onElimina, disabilitato }: { compito: Compito } & AzioniCompito) {
  const fatto = eFatto(compito);
  const id = `compito-${compito.id}`;
  return (
    <li className="flex items-start gap-3 py-2">
      <Checkbox
        id={id}
        checked={fatto}
        disabled={disabilitato}
        onCheckedChange={(checked) => onCambia(compito.id, checked === true ? "fatto" : "da_fare")}
        className="mt-0.5"
        aria-label={fatto ? "Segna da fare" : "Segna fatto"}
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className={`block text-sm leading-snug ${fatto ? "text-muted-foreground line-through" : ""}`}>
          <span className="whitespace-pre-wrap">{compito.testo}</span>
          {fatto && compito.completato_il ? <span className="mt-0.5 block text-xs no-underline">Fatto il {formatDate(compito.completato_il)}</span> : null}
        </label>
        {compito.link_skool ? (
          <a
            href={compito.link_skool}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Lezione Skool collegata{compito.nota_skool ? ` · ${compito.nota_skool}` : ""} <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Elimina sotto-compito" onClick={() => onElimina(compito.id)}>
        <Trash2 aria-hidden />
      </Button>
    </li>
  );
}

/**
 * Una tappa del piano d'azione con i suoi sotto-compiti. Se ha sotto-compiti la
 * spunta della tappa è derivata (la calcola il database) e non si tocca.
 */
export function RigaTappa({ tappa, numero, clienteId, onCambia, onElimina, disabilitato }: { tappa: Tappa; numero: number; clienteId: string } & AzioniCompito) {
  const fatta = eFatto(tappa);
  const conFigli = tappa.figli.length > 0;
  const { fatti, totale } = avanzamento(tappa);
  const id = `tappa-${tappa.id}`;
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={fatta}
          disabled={disabilitato || conFigli}
          onCheckedChange={(checked) => onCambia(tappa.id, checked === true ? "fatto" : "da_fare")}
          className="mt-1"
          aria-label={conFigli ? "Stato derivato dai sotto-compiti" : fatta ? "Segna da fare" : "Segna fatta"}
        />
        <label htmlFor={id} className="min-w-0 flex-1">
          <span className="eyebrow block text-[10px]">Tappa {numero}</span>
          <span className={`block font-medium leading-snug whitespace-pre-wrap ${fatta ? "text-muted-foreground line-through" : ""}`}>{tappa.testo}</span>
          {conFigli ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {fatti}/{totale} sotto-compiti fatti{fatta && tappa.completato_il ? ` · completata il ${formatDate(tappa.completato_il)}` : ""}
            </span>
          ) : fatta && tappa.completato_il ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">Fatta il {formatDate(tappa.completato_il)}</span>
          ) : null}
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <NuovoCompitoDialog clienteId={clienteId} padre={{ id: tappa.id, testo: tappa.testo }} />
          <Button variant="ghost" size="icon-sm" aria-label="Elimina tappa" onClick={() => onElimina(tappa.id)}>
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>
      {conFigli ? (
        <ul className="mt-1 ml-[7px] border-l pl-6">
          {tappa.figli.map((f) => (
            <RigaSottoCompito key={f.id} compito={f} onCambia={onCambia} onElimina={onElimina} disabilitato={disabilitato} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
