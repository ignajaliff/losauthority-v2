import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { CredenzialiCliente } from "../types";
import { CopiaButton } from "./CopiaButton";

interface CredenzialiCardProps {
  credenziali: CredenzialiCliente;
  onCreaAltro: () => void;
}

/** Email + password del nuovo cliente: si vedono UNA volta sola. */
export function CredenzialiCard({ credenziali, onCreaAltro }: CredenzialiCardProps) {
  const link = `${window.location.origin}/area`;
  const nome = credenziali.nombre.split(/\s+/)[0] ?? "";
  const messaggio =
    `Ciao ${nome}!\n` +
    `Ecco i tuoi accessi per iniziare il percorso Los Authority.\n\n` +
    `Link: ${link}\nEmail: ${credenziali.email}\nPassword: ${credenziali.password}\n\n` +
    `Apri il link, accedi con email e password ed entra nella tua area per compilare l'onboarding.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cliente creato</CardTitle>
        <CardDescription>La password si vede solo adesso: copiala prima di lasciare la pagina.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="font-mono text-sm break-all">{credenziali.email}</dd>
            </div>
            <CopiaButton testo={credenziali.email} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Password</dt>
              <dd className="font-mono text-sm break-all">{credenziali.password}</dd>
            </div>
            <CopiaButton testo={credenziali.password} />
          </div>
        </dl>
        <pre className="rounded-lg bg-muted p-3 text-xs break-words whitespace-pre-wrap">{messaggio}</pre>
        <div className="flex flex-wrap gap-2">
          <CopiaButton testo={messaggio} etichetta="Copia messaggio" variant="default" />
          {credenziali.id ? (
            <Button variant="secondary" size="sm" render={<Link to={`/clienti/${credenziali.id}`} />}>
              Vai alla scheda
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onCreaAltro}>
            Crea un altro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
