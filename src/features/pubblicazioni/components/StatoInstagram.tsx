import { Instagram, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { formatMomento } from "../format";
import { primaLetturaInCorso, useCollegaInstagram } from "../hooks/useInstagram";
import { eProfiloPrivato, handleDaUrl, type InstagramCliente } from "../types";

interface StatoInstagramProps {
  clienteId: string;
  stato: InstagramCliente;
}

function descrizione(stato: InstagramCliente): string {
  // Il messaggio del profilo privato è scritto per il cliente: gli altri errori sono tecnici e restano al team.
  if (eProfiloPrivato(stato.instagram_sync_errore)) return stato.instagram_sync_errore ?? "";
  if (stato.instagram_sync_errore) return "Ultima lettura non riuscita: riprovo da sola nei prossimi giorni, oppure premi «Rileggi il profilo».";
  if (stato.instagram_sync_il) return `Profilo letto ${formatMomento(stato.instagram_sync_il)} · numeri ogni 15 giorni, video nuovi e follower ogni 30`;
  return "Sto leggendo il profilo: i video compaiono qui tra poco.";
}

/** Riga sotto il titolo: profilo collegato, ultima lettura, eventuale errore e «Rileggi il profilo». */
export function StatoInstagram({ clienteId, stato }: StatoInstagramProps) {
  const rileggi = useCollegaInstagram(clienteId);
  const handle = handleDaUrl(stato.instagram);
  // Durante la prima lettura il bottone non serve (e la funzione la rifarebbe da capo).
  const occupato = rileggi.isPending || primaLetturaInCorso(stato);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
      <div className="grid gap-0.5">
        <p className="inline-flex items-center gap-1.5 font-medium">
          <Instagram className="size-4" aria-hidden />
          {stato.instagram ? (
            <a href={stato.instagram} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              @{handle ?? stato.instagram}
            </a>
          ) : (
            "Nessun profilo"
          )}
        </p>
        <p className={eProfiloPrivato(stato.instagram_sync_errore) ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {descrizione(stato)}
        </p>
      </div>
      <Button size="sm" variant="outline" disabled={occupato} onClick={() => rileggi.mutate(undefined)}>
        <RefreshCw className={occupato ? "animate-spin" : undefined} aria-hidden />
        {occupato ? "Leggo…" : "Rileggi il profilo"}
      </Button>
    </div>
  );
}
