import { format } from "date-fns";
import type { StatoSalvataggio } from "../hooks/useSalvaBozza";

interface IndicatoreSalvataggioProps {
  stato: StatoSalvataggio;
  ultimoSalvataggio: Date | null;
}

/** "Salvato · hh:mm" e gli altri stati del salvataggio automatico. */
export function IndicatoreSalvataggio({ stato, ultimoSalvataggio }: IndicatoreSalvataggioProps) {
  let testo: string;
  switch (stato) {
    case "in_attesa":
      testo = "Modifiche in attesa…";
      break;
    case "salvataggio":
      testo = "Salvataggio…";
      break;
    case "errore":
      testo = "Salvataggio non riuscito";
      break;
    case "salvato":
      testo = ultimoSalvataggio ? `Salvato · ${format(ultimoSalvataggio, "HH:mm")}` : "Salvato";
      break;
    default:
      testo = "Le risposte si salvano da sole";
  }
  return (
    <span aria-live="polite" className={stato === "errore" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
      {testo}
    </span>
  );
}
