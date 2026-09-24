import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { CredenzialiStaff as Credenziali } from "../types";
import { BottoneCopia } from "./BottoneCopia";

interface CredenzialiStaffProps {
  credenziali: Credenziali;
  onAggiungiAltro: () => void;
}

/** Riepilogo post-creazione: messaggio pronto da inviare, password visibile solo ora. */
export function CredenzialiStaff({ credenziali, onAggiungiAltro }: CredenzialiStaffProps) {
  const link = `${window.location.origin}/auth/login`;
  const nome = credenziali.nombre.split(/\s+/)[0] ?? "";
  const messaggio =
    `Ciao ${nome}!\n` +
    `Ecco i tuoi accessi al gestionale Los Authority.\n\n` +
    `Link: ${link}\n` +
    `Email: ${credenziali.email}\n` +
    `Password: ${credenziali.password}\n\n` +
    `Accedi con email e password.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff creato</CardTitle>
        <CardDescription>
          Invia questo messaggio al collaboratore. La password si vede solo ora: copiala adesso.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <pre className="whitespace-pre-wrap rounded-md border bg-muted p-4 font-mono text-xs">{messaggio}</pre>
        <div className="flex flex-wrap gap-2">
          <BottoneCopia testo={messaggio} etichetta="Copia messaggio" variant="default" />
          <BottoneCopia testo={credenziali.email} etichetta="Solo email" />
          <BottoneCopia testo={credenziali.password} etichetta="Solo password" />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Link to="/staff" className="inline-flex">
          <Button variant="outline" size="sm">
            Torna allo staff
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={onAggiungiAltro}>
          Aggiungi un altro
        </Button>
      </CardFooter>
    </Card>
  );
}
