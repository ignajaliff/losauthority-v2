import { Image, Pencil, Trash2 } from "lucide-react";
import { useApriFile } from "@/features/fatture";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
import { useToggleAttivaSpesa } from "../hooks/useSpese";
import { BUCKET_RICEVUTE, type Spesa, type TipoSpesa } from "../types";

interface SpeseTabellaProps {
  spese: Spesa[];
  tipo: TipoSpesa;
  onModifica: (spesa: Spesa) => void;
  onElimina: (spesa: Spesa) => void;
}

/** Tabella spese: variabili (con foto scontrino) o fisse (con Switch attiva). Sul telefono una colonna sola. */
export function SpeseTabella({ spese, tipo, onModifica, onElimina }: SpeseTabellaProps) {
  const apri = useApriFile();
  const toggle = useToggleAttivaSpesa();
  const fisse = tipo === "fissa";

  return (
    <Table>
      <TableHeader className="hidden md:table-header-group">
        <TableRow>
          <TableHead>Descrizione</TableHead>
          <TableHead className="text-right">{fisse ? "Importo mensile" : "Importo"}</TableHead>
          <TableHead>{fisse ? "Attiva dal" : "Data"}</TableHead>
          <TableHead>{fisse ? "Attiva" : "Foto"}</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spese.map((s) => {
          const sospesa = fisse && !s.attiva;
          const attivaOFoto = fisse ? (
            <Switch
              checked={s.attiva}
              disabled={toggle.isPending}
              aria-label={s.attiva ? "Sospendi spesa fissa" : "Riattiva spesa fissa"}
              onCheckedChange={() => toggle.mutate(s)}
            />
          ) : s.ricevuta_path ? (
            <Button
              variant="outline"
              size="sm"
              disabled={apri.isPending}
              onClick={() => apri.mutate({ bucket: BUCKET_RICEVUTE, path: s.ricevuta_path as string })}
            >
              <Image /> Apri
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
          const azioni = (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Modifica spesa" onClick={() => onModifica(s)}>
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Elimina spesa" onClick={() => onElimina(s)}>
                <Trash2 />
              </Button>
            </div>
          );
          return (
            <TableRow key={s.id} className={sospesa ? "text-muted-foreground" : undefined}>
              <TableCell className="px-0 whitespace-normal md:px-[18px]">
                <span className="font-medium text-foreground">{s.descrizione}</span>
                {sospesa ? (
                  <Badge variant="outline" className="ml-2">
                    Sospesa
                  </Badge>
                ) : null}
                {/* Telefono: importo e data sotto la descrizione; attiva/foto a sinistra, azioni a destra. */}
                <div className="mt-1 grid gap-2 md:hidden">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(s.importo)}
                      {fisse ? "/mese" : null}
                    </span>
                    <span className="text-xs">
                      {fisse ? "attiva dal " : ""}
                      {formatDate(s.data)}
                    </span>
                  </p>
                  <div className="flex min-h-9 items-center justify-between gap-3">
                    {fisse ? (
                      // Sul telefono non c'è l'intestazione: l'etichetta «Attiva» va accanto allo switch.
                      <span className="flex items-center gap-3 pl-1 text-xs">
                        {attivaOFoto}
                        Attiva
                      </span>
                    ) : s.ricevuta_path ? (
                      attivaOFoto
                    ) : (
                      <span />
                    )}
                    {azioni}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden text-right font-medium tabular-nums md:table-cell">{formatCurrency(s.importo)}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(s.data)}</TableCell>
              <TableCell className="hidden md:table-cell">{attivaOFoto}</TableCell>
              <TableCell className="hidden text-right md:table-cell">{azioni}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
