import { ExternalLink, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useApriFile } from "@/features/fatture";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate, todayIso } from "@/shared/utils/formatDate";
import { useRileggiF24, useTogglePagatoF24 } from "../hooks/useF24";
import { BUCKET_F24, type F24 } from "../types";

interface F24TabellaProps {
  righe: F24[];
  onModifica: (f24: F24) => void;
  onElimina: (f24: F24) => void;
}

type VarianteBadge = "outline" | "active" | "churn" | "expiring";

/** Etichetta della scadenza: scaduto / oggi / domani / entro 7 giorni / data. */
export function badgeScadenza(scadenza: string | null, oggi = todayIso()): { variante: VarianteBadge; testo: string } {
  if (!scadenza) return { variante: "outline", testo: "Senza scadenza" };
  const giorni = Math.round((Date.parse(scadenza) - Date.parse(oggi)) / 86400000);
  if (giorni < 0) return { variante: "churn", testo: `Scaduto il ${formatDate(scadenza)}` };
  if (giorni === 0) return { variante: "churn", testo: "Scade oggi" };
  if (giorni === 1) return { variante: "churn", testo: "Scade domani" };
  if (giorni <= 7) return { variante: "expiring", testo: `Scade il ${formatDate(scadenza)}` };
  return { variante: "outline", testo: `Scade il ${formatDate(scadenza)}` };
}

/** Rata F24: desktop una riga a 5 colonne; telefono una colonna con importo, scadenza e azioni sotto la descrizione. */
export function F24Tabella({ righe, onModifica, onElimina }: F24TabellaProps) {
  const apri = useApriFile();
  const toggle = useTogglePagatoF24();
  const rileggi = useRileggiF24();

  return (
    <Table>
      <TableHeader className="hidden md:table-header-group">
        <TableRow>
          <TableHead>Descrizione</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead>Scadenza</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {righe.map((f) => {
          const badge = f.pagato
            ? { variante: "active" as const, testo: `Pagato${f.pagato_il ? ` il ${formatDate(f.pagato_il)}` : ""}` }
            : badgeScadenza(f.scadenza);
          const importo = f.importo != null ? formatCurrency(f.importo) : <span className="text-muted-foreground">—</span>;
          const bottoneStato = (
            <Button variant={f.pagato ? "ghost" : "secondary"} size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate(f)}>
              {f.pagato ? "Segna da pagare" : "Segna pagato"}
            </Button>
          );
          const azioni = (
            <>
              <Button variant="outline" size="sm" disabled={apri.isPending} onClick={() => apri.mutate({ bucket: BUCKET_F24, path: f.pdf_path })}>
                <ExternalLink /> PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={rileggi.isPending}
                title="Faccio rileggere il PDF all'AI: compila questa riga e aggiunge le rate mancanti"
                onClick={() => rileggi.mutate(f.id)}
              >
                <RefreshCw className={rileggi.isPending ? "animate-spin" : undefined} /> Rileggi con AI
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Modifica F24" onClick={() => onModifica(f)}>
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Elimina F24" onClick={() => onElimina(f)}>
                <Trash2 />
              </Button>
            </>
          );
          return (
            <TableRow key={f.id} className={f.pagato ? "text-muted-foreground" : undefined}>
              <TableCell className="px-0 whitespace-normal md:px-[18px]">
                <div className="font-medium text-foreground">{f.descrizione || "F24"}</div>
                <div className="text-xs text-muted-foreground">caricato il {formatDate(f.created_at)}</div>
                {/* Telefono: importo e scadenza, poi tutte le azioni (vanno a capo). */}
                <div className="mt-2.5 grid gap-2.5 md:hidden">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-medium tabular-nums">{importo}</span>
                    <Badge variant={badge.variante}>{badge.testo}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {bottoneStato}
                    {azioni}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden text-right font-medium tabular-nums md:table-cell">{importo}</TableCell>
              <TableCell className="hidden whitespace-normal md:table-cell">
                <Badge variant={badge.variante}>{badge.testo}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">{bottoneStato}</TableCell>
              <TableCell className="hidden text-right md:table-cell">
                <div className="flex justify-end gap-1">{azioni}</div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
