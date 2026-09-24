import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface ListaCardProps {
  titolo: string;
  sottotitolo?: string;
  link?: { href: string; testo: string };
  caricamento: boolean;
  errore: boolean;
  vuoto: boolean;
  testoVuoto: string;
  children: ReactNode;
}

/** Card della dashboard con lista: gestisce loading, errore e stato vuoto in modo uniforme. */
export function ListaCard({ titolo, sottotitolo, link, caricamento, errore, vuoto, testoVuoto, children }: ListaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titolo}</CardTitle>
        {sottotitolo ? <CardDescription>{sottotitolo}</CardDescription> : null}
        {link ? (
          <CardAction>
            <Link to={link.href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              {link.testo}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {caricamento ? <SkeletonRighe righe={3} /> : null}
        {errore ? <ErroreCaricamento /> : null}
        {!caricamento && !errore && vuoto ? <p className="text-sm text-muted-foreground">{testoVuoto}</p> : null}
        {!caricamento && !errore && !vuoto ? <ul className="divide-y">{children}</ul> : null}
      </CardContent>
    </Card>
  );
}
