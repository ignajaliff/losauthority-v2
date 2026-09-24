import { KeyRound } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useResetPassword } from "../hooks/useAccountCliente";
import type { ClienteDettaglio } from "../types";
import { CopiaButton } from "./CopiaButton";

/** Email di accesso e reset della password (la nuova si vede una volta sola). */
export function AccessoCliente({ cliente }: { cliente: ClienteDettaglio }) {
  const reset = useResetPassword(cliente.id);
  const link = `${window.location.origin}/area`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesso cliente</CardTitle>
        <CardDescription>Link all'area cliente e credenziali.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-sm break-all">{cliente.utente.email}</span>
          <CopiaButton testo={cliente.utente.email} etichetta="Copia email" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs break-all text-muted-foreground">{link}</span>
          <CopiaButton testo={link} etichetta="Copia link" />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t pt-3">
          {reset.data ? (
            <>
              <span className="text-sm text-muted-foreground">Nuova password:</span>
              <span className="font-mono text-sm">{reset.data}</span>
              <CopiaButton testo={reset.data} />
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => reset.mutate()} disabled={reset.isPending}>
              <KeyRound aria-hidden />
              {reset.isPending ? "Reimposto…" : "Reset password"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
