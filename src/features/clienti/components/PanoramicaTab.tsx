import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";
import { formatDate } from "@/shared/utils/formatDate";
import type { ClienteDettaglio } from "../types";
import { BadgeFase } from "./BadgesCliente";
import { NoteCliente } from "./NoteCliente";
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

/** Tab Panoramica: cruscotto, piano d'azione, nota del team (l'analisi di Aura vive nel tab Onboarding). */
export function PanoramicaTab({ cliente }: { cliente: ClienteDettaglio }) {
  return (
    <div className="grid gap-6">
      <dl className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg bg-card p-4 border">
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
      <PianoAzione clienteId={cliente.id} />
      <NoteCliente cliente={cliente} />
    </div>
  );
}
