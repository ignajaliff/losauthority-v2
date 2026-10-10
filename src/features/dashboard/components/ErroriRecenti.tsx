import { formatDateTime } from "@/shared/utils/formatDate";
import type { ErroreRecente } from "../types";
import { ListaCard } from "./ListaCard";

/** Errori tecnici degli ultimi 7 giorni. Il chiamante non la monta se la lista è vuota. */
export function ErroriRecenti({ errori }: { errori: ErroreRecente[] }) {
  return (
    <ListaCard
      titolo="Errori recenti"
      sottotitolo="Problemi tecnici degli ultimi 7 giorni"
      link={{ href: "/errori", testo: "Tutti gli errori" }}
      caricamento={false}
      errore={false}
      vuoto={errori.length === 0}
      testoVuoto="Nessun errore recente."
    >
      {errori.map((e) => (
        // Telefono: la data va sotto il messaggio, che così ha tutta la larghezza.
        <li key={e.id} className="flex items-start justify-between gap-3 py-2 max-sm:flex-col max-sm:gap-1">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold break-all text-destructive">{e.scope}</p>
            <p className="break-words text-sm text-muted-foreground">{e.message}</p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDateTime(e.created_at)}</span>
        </li>
      ))}
    </ListaCard>
  );
}
