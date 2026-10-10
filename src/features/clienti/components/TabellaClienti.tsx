import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate } from "@/shared/utils/formatDate";
import type { ClienteRiga } from "../types";
import { BadgeFase, BadgeStatoOnboarding, BadgeTag } from "./BadgesCliente";
import { LinkRapidi } from "./LinkRapidi";
import { ProssimaCallCella } from "./ProssimaCallCella";

/**
 * STATO: durante l'onboarding è lo stato di lavorazione; dalla call 1 in poi
 * diventa l'avanzamento dei compiti della call corrente.
 */
function StatoCella({ c }: { c: ClienteRiga }) {
  // Contratto pagato ma programma non ancora attivato (modulo Contratti): prima di tutto il resto.
  if (c.da_attivare) return <Badge variant="expiring" dot>Da attivare</Badge>;
  if (c.fase === "onboarding") return <BadgeStatoOnboarding stato={c.stato_onboarding} />;
  if (c.call_corrente == null || !c.totale) return <span className="text-muted-foreground">—</span>;
  const fatti = c.fatti ?? 0;
  const inCorso = c.in_corso ?? 0;
  const tuoi = c.di_wesley_aperti ?? 0;
  const completi = fatti >= c.totale;
  return (
    <span className="flex flex-col items-start gap-1">
      <Badge variant={completi ? "default" : "outline"}>
        Compiti {fatti}/{c.totale}
      </Badge>
      {inCorso > 0 || tuoi > 0 ? (
        <span className="text-xs text-muted-foreground">
          {inCorso > 0 ? `${inCorso} in corso` : null}
          {inCorso > 0 && tuoi > 0 ? " · " : null}
          {tuoi > 0 ? <span className="font-semibold text-destructive">{tuoi} {tuoi === 1 ? "tuo" : "tuoi"}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

/** Conteggi visibili a tutto il team; gli importi no. */
function FattureCella({ c }: { c: ClienteRiga }) {
  const totali = c.fatture_totali ?? 0;
  if (totali === 0) return <span className="text-muted-foreground">—</span>;
  const daPagare = c.fatture_da_pagare ?? 0;
  return (
    <span className="flex flex-col items-start gap-1">
      <Badge variant={daPagare === 0 ? "default" : "outline"}>{totali} {totali === 1 ? "fattura" : "fatture"}</Badge>
      {daPagare > 0 ? (
        <span className="text-xs text-muted-foreground">
          {daPagare} da pagare
          {c.fatture_prossima_scadenza ? ` · scade ${formatDate(c.fatture_prossima_scadenza)}` : ""}
        </span>
      ) : null}
    </span>
  );
}

/** Etichetta piccola come l'intestazione della colonna (lista del telefono). */
const ETICHETTA_MOBILE = "text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase";

function VoceMobile({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1">
      <dt className={ETICHETTA_MOBILE}>{etichetta}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

/** Sotto md: una scheda per cliente con le stesse informazioni delle colonne della tabella. */
function ListaClientiMobile({ righe }: { righe: ClienteRiga[] }) {
  return (
    <ul className="divide-y divide-border-faint overflow-hidden rounded-lg border bg-card md:hidden">
      {righe.map((c) => (
        <li key={c.id}>
          <Link
            to={`/clienti/${c.id}`}
            aria-label={`Apri la scheda di ${c.nombre ?? c.email ?? "cliente"}`}
            className="grid gap-3 px-4 py-3.5 transition-colors active:bg-muted/60"
          >
            <span className="flex min-w-0 items-start justify-between gap-3">
              <span className="grid min-w-0 gap-1">
                <span className="truncate font-medium">{c.nombre ?? "—"}</span>
                <span className="truncate text-xs text-muted-foreground">{c.email}</span>
                <BadgeTag labels={c.tag_labels} />
              </span>
              <BadgeFase fase={c.fase} breve />
            </span>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <VoceMobile etichetta="Stato">
                <StatoCella c={c} />
              </VoceMobile>
              <VoceMobile etichetta="Prossima call">
                <ProssimaCallCella iso={c.prossima_call} />
              </VoceMobile>
              <VoceMobile etichetta="Inizio">
                <span className="text-muted-foreground">{formatDate(c.data_inizio)}</span>
              </VoceMobile>
              <VoceMobile etichetta="Fatture">
                <FattureCella c={c} />
              </VoceMobile>
            </dl>
          </Link>
          {c.notion_hub_url || c.instagram || c.tiktok || c.telefono ? (
            <div className="mx-4 flex items-center justify-between gap-3 border-t border-border-faint py-2.5">
              <span className={ETICHETTA_MOBILE}>Link rapidi</span>
              <LinkRapidi notionHubUrl={c.notion_hub_url} instagram={c.instagram} tiktok={c.tiktok} telefono={c.telefono} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function TabellaClienti({ righe }: { righe: ClienteRiga[] }) {
  const navigate = useNavigate();
  return (
    <>
      <ListaClientiMobile righe={righe} />
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Inizio</TableHead>
              <TableHead>Prossima call</TableHead>
              <TableHead>Fatture</TableHead>
              <TableHead>Link rapidi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {righe.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                tabIndex={0}
                aria-label={`Apri la scheda di ${c.nombre ?? c.email ?? "cliente"}`}
                onClick={() => navigate(`/clienti/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/clienti/${c.id}`);
                }}
              >
                <TableCell>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="max-w-60 truncate font-medium">{c.nombre ?? "—"}</span>
                    <span className="max-w-60 truncate text-xs text-muted-foreground">{c.email}</span>
                    <BadgeTag labels={c.tag_labels} />
                  </span>
                </TableCell>
                <TableCell>
                  <BadgeFase fase={c.fase} breve />
                </TableCell>
                <TableCell>
                  <StatoCella c={c} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.data_inizio)}</TableCell>
                <TableCell>
                  <ProssimaCallCella iso={c.prossima_call} />
                </TableCell>
                <TableCell>
                  <FattureCella c={c} />
                </TableCell>
                <TableCell>
                  <LinkRapidi notionHubUrl={c.notion_hub_url} instagram={c.instagram} tiktok={c.tiktok} telefono={c.telefono} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
