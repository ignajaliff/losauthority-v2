import { useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDate } from "@/shared/utils/formatDate";
import { euroContratto } from "@contratti/documento.ts";
import { statoMeta, tipoLabel } from "@contratti/tipi.ts";
import { prossimoPasso, type ContrattoInLista } from "../../types";

/** Elenco dei contratti: ogni riga apre la scheda. */
export function ContrattiTabella({ contratti, isAdmin }: { contratti: ContrattoInLista[]; isAdmin: boolean }) {
  const navigate = useNavigate();
  if (contratti.length === 0) {
    return <StatoVuoto titolo="Nessun contratto ancora" testo={isAdmin ? "Crea il primo invito e manda il link al cliente." : undefined} />;
  }
  return (
    <div className="overflow-auto rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>Prezzo</TableHead>
            <TableHead>Creato</TableHead>
            <TableHead>Firmato</TableHead>
            <TableHead>Da fare</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contratti.map((c) => {
            const stato = statoMeta(c.stato, !!c.aperto_il);
            return (
              <TableRow
                key={c.id}
                tabIndex={0}
                role="link"
                aria-label={c.cliente_nome || c.note || "Contratto"}
                className="cursor-pointer"
                onClick={() => navigate(`/contratti/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/contratti/${c.id}`);
                  }
                }}
              >
                <TableCell>
                  <span className="grid min-w-0">
                    <span className="text-sm font-semibold whitespace-nowrap">{c.cliente_nome || c.note || "In attesa dei dati"}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.offerta_nome || c.programma}
                      {c.tipo ? ` · ${tipoLabel(c.tipo)}` : ""}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={stato.tone} dot>
                    {stato.label}
                  </Badge>
                </TableCell>
                <TableCell className="figure whitespace-nowrap">{euroContratto(c.prezzo)} €</TableCell>
                <TableCell className="figure text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                <TableCell className="figure text-muted-foreground">{c.firmato_il ? formatDate(c.firmato_il) : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{prossimoPasso(c.stato)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
