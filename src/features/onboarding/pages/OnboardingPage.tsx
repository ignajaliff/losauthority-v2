import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useListaOnboarding } from "../hooks/useOnboarding";
import { BadgeStatoOnboarding, PalliniSchede, SelectStatoOnboarding } from "../components/StatoOnboarding";
import type { StatoOnboarding } from "../types";

type Filtro = StatoOnboarding | "tutti";

/** Lista dei clienti con lo stato dell'onboarding e delle 3 schede. */
export default function OnboardingPage() {
  const [filtro, setFiltro] = useState<Filtro>("tutti");
  const { data, isLoading, isError } = useListaOnboarding();
  const righe = (data ?? []).filter((r) => filtro === "tutti" || r.stato === filtro);

  return (
    <div>
      <PageHeader
        titolo="Onboarding"
        sottotitolo="Le 3 schede di ogni cliente: chi ha finito aspetta l'hub, chi è a metà va sollecitato."
        azioni={<SelectStatoOnboarding conTutti valore={filtro} onChange={setFiltro} />}
      />

      {isLoading ? <SkeletonRighe righe={6} /> : null}
      {isError ? <ErroreCaricamento /> : null}
      {data && righe.length === 0 ? (
        <StatoVuoto
          titolo={data.length === 0 ? "Ancora nessun cliente" : "Nessun cliente con questo stato"}
          testo={data.length === 0 ? "I clienti compaiono qui appena vengono creati." : "Prova a cambiare il filtro."}
        />
      ) : null}

      {righe.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Stato onboarding</TableHead>
                <TableHead>Schede</TableHead>
                <TableHead>Ultimo invio</TableHead>
                <TableHead className="sr-only">Apri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {righe.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/onboarding/${r.id}`} className="font-medium hover:underline">
                      {r.nombre}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{r.email}</span>
                  </TableCell>
                  <TableCell>
                    <BadgeStatoOnboarding stato={r.stato} />
                  </TableCell>
                  <TableCell>
                    <PalliniSchede schede={r.schede} />
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(r.ultimoInvio)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/onboarding/${r.id}`} className="text-sm underline underline-offset-4">
                      Apri
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
