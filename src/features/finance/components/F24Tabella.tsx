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

type VarianteBadge = "outline" | "secondary" | "destructive" | "default";

/** Etichetta della scadenza: scaduto / oggi / domani / entro 7 giorni / data. */
export function badgeScadenza(scadenza: string | null, oggi = todayIso()): { variante: VarianteBadge; testo: string } {
  if (!scadenza) return { variante: "outline", testo: "Senza scadenza" };
  const giorni = Math.round((Date.parse(scadenza) - Date.parse(oggi)) / 86400000);
  if (giorni < 0) return { variante: "destructive", testo: `Scaduto il ${formatDate(scadenza)}` };
  if (giorni === 0) return { variante: "destructive", testo: "Scade oggi" };
  if (giorni === 1) return { variante: "destructive", testo: "Scade domani" };
  if (giorni <= 7) return { variante: "default", testo: `Scade il ${formatDate(scadenza)}` };
  return { variante: "outline", testo: `Scade il ${formatDate(scadenza)}` };
}

export function F24Tabella({ righe, onModifica, onElimina }: F24TabellaProps) {
  const apri = useApriFile();
  const toggle = useTogglePagatoF24();
  const rileggi = useRileggiF24();

  return (
    <Table>
      <TableHeader>
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
            ? { variante: "secondary" as const, testo: `Pagato${f.pagato_il ? ` il ${formatDate(f.pagato_il)}` : ""}` }
            : badgeScadenza(f.scadenza);
          return (
            <TableRow key={f.id} className={f.pagato ? "text-muted-foreground" : undefined}>
              <TableCell className="whitespace-normal">
                <div className="font-medium text-foreground">{f.descrizione || "F24"}</div>
                <div className="text-xs text-muted-foreground">caricato il {formatDate(f.created_at)}</div>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {f.importo != null ? formatCurrency(f.importo) : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="whitespace-normal">
                <Badge variant={badge.variante}>{badge.testo}</Badge>
              </TableCell>
              <TableCell>
                <Button variant={f.pagato ? "ghost" : "secondary"} size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate(f)}>
                  {f.pagato ? "Segna da pagare" : "Segna pagato"}
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
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
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
