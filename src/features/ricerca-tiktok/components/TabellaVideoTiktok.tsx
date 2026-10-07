import { format } from "date-fns";
import { Check, ExternalLink, SquareKanban } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatConteggio } from "@/shared/utils/formatConteggio";
import { cn } from "@/lib/utils";
import { RIGHE_SENZA_TEMA, type VideoRicerca } from "../types";

interface TabellaVideoTiktokProps {
  video: VideoRicerca[];
  /** Colonna lingua: inutile nelle top per lingua, dove è la stessa per tutti. */
  conLingua?: boolean;
  /** Link già nei riferimenti di un contenuto del Workflow. */
  nelWorkflow: Set<string>;
  onWorkflow: (v: VideoRicerca) => void;
  occupato: boolean;
}

const dataBreve = (iso: string | null) => (iso ? format(new Date(iso), "dd/MM") : "—");

/** I segnali del documento: non tolgono il video, lo segnalano. */
function Segnali({ v }: { v: VideoRicerca }) {
  if (!v.da_non_replicare && !v.fuori_tema && !v.sponsorizzato) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {v.da_non_replicare ? <Badge variant="churn">Da non replicare</Badge> : null}
      {v.fuori_tema ? <Badge variant="outline">Fuori tema</Badge> : null}
      {v.sponsorizzato ? <Badge variant="expiring">Sponsorizzato</Badge> : null}
    </span>
  );
}

/** «Di cosa parla»: la riga di Aura dalla didascalia; senza didascalia, solo hashtag o didascalia non chiara in grigio. */
function DiCosaParla({ v }: { v: VideoRicerca }) {
  const vuoto = v.senza_didascalia || v.solo_hashtag || !v.di_cosa_parla || RIGHE_SENZA_TEMA.includes(v.di_cosa_parla);
  return (
    <>
      <span className={cn(vuoto && "text-muted-foreground italic")}>{v.di_cosa_parla ?? (v.didascalia ? v.didascalia.slice(0, 90) : "senza didascalia")}</span>
      <Segnali v={v} />
    </>
  );
}

const diChi = (v: VideoRicerca) => (v.autore ? `di @${v.autore}` : `numero ${v.posizione}`);

function AzioneWorkflow({ v, nelWorkflow, onWorkflow, occupato }: { v: VideoRicerca } & Omit<TabellaVideoTiktokProps, "video" | "conLingua">) {
  if (nelWorkflow.has(v.url)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-status-active" title="Già nel Workflow">
        <Check className="size-3.5" aria-hidden /> <span className="xl:sr-only">Nel Workflow</span>
      </span>
    );
  }
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={occupato}
      onClick={() => onWorkflow(v)}
      aria-label={`Porta nel Workflow il video ${diChi(v)}`}
      title="Porta nel Workflow"
    >
      <SquareKanban aria-hidden /> <span className="xl:hidden">Workflow</span>
    </Button>
  );
}

function LinkVideo({ v }: { v: VideoRicerca }) {
  return (
    <a
      href={v.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
      aria-label={`Apri su TikTok il video ${diChi(v)}`}
      title="Apri su TikTok"
    >
      <span className="xl:hidden">Apri</span> <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

/** Una tabella del documento: #, autore, lingua, like, views, data, di cosa parla, link (+ Workflow). Sotto xl carte: la tabella non ci starebbe. */
export function TabellaVideoTiktok({ conLingua = true, ...props }: TabellaVideoTiktokProps) {
  const { video } = props;
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-card xl:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Autore</TableHead>
              {conLingua ? <TableHead>Lingua</TableHead> : null}
              <TableHead className="text-right">Like</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Di cosa parla</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Workflow</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {video.map((v) => (
              <TableRow key={v.id} className={cn(v.da_non_replicare && "bg-status-churn-soft/40")}>
                <TableCell className="figure text-[13px] text-muted-foreground">{v.posizione}</TableCell>
                <TableCell className="max-w-32 truncate text-[13px] font-medium">{v.autore ? `@${v.autore}` : "—"}</TableCell>
                {conLingua ? <TableCell className="text-[12.5px] text-muted-foreground uppercase">{v.lingua ?? "–"}</TableCell> : null}
                <TableCell className="figure text-right text-[13px] font-semibold">{formatConteggio(v.mi_piace)}</TableCell>
                <TableCell className="figure text-right text-[13px] text-muted-foreground">{formatConteggio(v.visualizzazioni)}</TableCell>
                <TableCell className="figure text-[12.5px] text-muted-foreground">{dataBreve(v.pubblicato_il)}</TableCell>
                <TableCell className="min-w-56 text-[13px] whitespace-normal">
                  <DiCosaParla v={v} />
                </TableCell>
                <TableCell>
                  <LinkVideo v={v} />
                </TableCell>
                <TableCell className="text-right">
                  <AzioneWorkflow v={v} {...props} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ol className="grid gap-2 xl:hidden">
        {video.map((v) => (
          <li key={v.id} className={cn("grid gap-1.5 rounded-lg border bg-card p-3", v.da_non_replicare && "bg-status-churn-soft/40")}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">
                <span className="figure mr-1.5 text-muted-foreground">{v.posizione}</span>
                {v.autore ? `@${v.autore}` : "—"}
              </span>
              <span className="figure shrink-0 text-sm font-semibold">{formatConteggio(v.mi_piace)} like</span>
            </div>
            <p className="text-[13px] leading-snug">
              <DiCosaParla v={v} />
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="figure">
                {formatConteggio(v.visualizzazioni)} views · {dataBreve(v.pubblicato_il)}
                {conLingua ? (
                  <>
                    {" "}
                    · <span className="uppercase">{v.lingua ?? "–"}</span>
                  </>
                ) : null}
              </span>
              <span className="flex items-center gap-2">
                <LinkVideo v={v} />
                <AzioneWorkflow v={v} {...props} />
              </span>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
