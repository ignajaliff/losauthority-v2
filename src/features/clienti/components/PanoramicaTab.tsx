import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";
import { formatDate } from "@/shared/utils/formatDate";
import type { ClienteDettaglio } from "../types";
import { AnalisiAura } from "./AnalisiAura";
import { BadgeFase } from "./BadgesCliente";
import { NoteInterne } from "./NoteInterne";
import { PianoAzione } from "./PianoAzione";
import { ProssimaCallCella } from "./ProssimaCallCella";

function Voce({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground uppercase">{etichetta}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Tab Panoramica: cruscotto, piano d'azione, analisi di Aura, note interne. */
export function PanoramicaTab({ cliente }: { cliente: ClienteDettaglio }) {
  return (
    <div className="grid gap-6">
      <dl className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Voce etichetta="Fase">
          <BadgeFase fase={cliente.fase} />
        </Voce>
        <Voce etichetta="Prossima call">
          <ProssimaCallCella iso={cliente.prossima_call} />
        </Voce>
        <Voce etichetta="Inizio percorso">{formatDate(cliente.data_inizio)}</Voce>
        <Voce etichetta="Hub Notion">
          {cliente.notion_hub_url ? (
            <a href={cliente.notion_hub_url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Apri hub <ExternalLink aria-hidden />
            </a>
          ) : (
            <span className="text-muted-foreground">non ancora creato</span>
          )}
        </Voce>
      </dl>
      <PianoAzione clienteId={cliente.id} haHub={Boolean(cliente.notion_hub_url)} />
      <AnalisiAura clienteId={cliente.id} />
      <NoteInterne clienteId={cliente.id} />
    </div>
  );
}
