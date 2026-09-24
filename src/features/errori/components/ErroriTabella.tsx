import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { ErroreLog } from "../types";
import { ContextLista } from "./ContextLista";

function ErroreRiga({ errore }: { errore: ErroreLog }) {
  const [aperto, setAperto] = useState(false);
  const haContext = errore.context !== null;

  return (
    <Fragment>
      <TableRow>
        <TableCell className="w-8 p-1 align-top">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-expanded={aperto}
            aria-label={aperto ? "Nascondi dettagli" : "Mostra dettagli"}
            disabled={!haContext}
            onClick={() => setAperto((v) => !v)}
          >
            {aperto ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
          </Button>
        </TableCell>
        <TableCell className="align-top font-mono text-xs text-muted-foreground">{formatDateTime(errore.created_at)}</TableCell>
        <TableCell className="align-top">
          <Badge variant="secondary">{errore.scope}</Badge>
        </TableCell>
        <TableCell className="max-w-xl align-top break-words whitespace-normal">{errore.message}</TableCell>
      </TableRow>
      {aperto ? (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell />
          <TableCell colSpan={3} className="whitespace-normal py-3">
            <ContextLista context={errore.context} />
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

/** Tabella degli errori: data/ora, scope, messaggio e dettagli espandibili. */
export function ErroriTabella({ errori }: { errori: ErroreLog[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Quando</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Messaggio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errori.map((e) => (
            <ErroreRiga key={e.id} errore={e} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
