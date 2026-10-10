import { CalendarClock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { formatDate } from "@/shared/utils/formatDate";
import type { DocumentoLegale, VersioneCrm } from "../types";

interface AvvisoNuovaVersioneProps {
  versione: VersioneCrm;
  documenti: DocumentoLegale[];
  onApri: (d: DocumentoLegale) => void;
}

/** In arrivo una versione nuova dei documenti: cosa cambia, da quando, e come opporsi. */
export function AvvisoNuovaVersione({ versione, documenti, onApri }: AvvisoNuovaVersioneProps) {
  return (
    <Alert>
      <CalendarClock aria-hidden />
      <AlertTitle>Dal {formatDate(versione.efficace_dal)} cambiano i documenti della sezione Clienti</AlertTitle>
      <AlertDescription className="grid gap-2">
        {versione.sintesi_modifiche ? <p>Cosa cambia: {versione.sintesi_modifiche}</p> : null}
        <p>
          Da quel giorno ti chiederemo di accettarli di nuovo per continuare a usare la sezione. Se non sei d'accordo, scrivilo a Wesley prima di
          quella data. I tuoi contatti restano tuoi: puoi esportarli quando vuoi.
        </p>
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          {documenti.map((d) => (
            <button
              key={d.id}
              type="button"
              className="text-left underline underline-offset-4 hover:text-foreground pointer-coarse:py-2"
              onClick={() => onApri(d)}
            >
              {d.titolo} (nuova versione)
            </button>
          ))}
        </p>
      </AlertDescription>
    </Alert>
  );
}
