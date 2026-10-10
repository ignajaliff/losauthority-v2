import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { ClienteDettaglio } from "../types";

/** Nota interna del team (colonna `clienti.note`): si legge qui, si modifica in Impostazioni → Dati cliente. */
export function NoteCliente({ cliente }: { cliente: ClienteDettaglio }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <CardTitle>Note</CardTitle>
            <CardDescription>Appunti del team — il cliente non li vede.</CardDescription>
          </div>
          <Link to={`/clienti/${cliente.id}?tab=impostazioni`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil aria-hidden /> Modifica
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {cliente.note ? (
          <p className="whitespace-pre-wrap break-words text-sm">{cliente.note}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Nessuna nota. Aggiungila da Impostazioni → Dati cliente.</p>
        )}
      </CardContent>
    </Card>
  );
}
