import { ArrowUpRight, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { paginaArea } from "@area/pagine.ts";
import { avanzamento, eFatto, type Compito, type StatoCompito, type Tappa } from "@/features/clienti";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Progress } from "@/shared/components/ui/progress";
import { formatDate } from "@/shared/utils/formatDate";
import type { LezioneLink } from "../../hooks/useLezioniPerUrl";

interface DettaglioTappaProps {
  tappa: Tappa;
  numero: number;
  totale: number;
  /** Da che lato entra la scheda: "avanti" = da destra, "indietro" = da sinistra. */
  direzione: "avanti" | "indietro";
  /** Lezioni del catalogo per URL: dà il titolo ai link Skool dei sotto-compiti. */
  lezioni: Map<string, LezioneLink>;
  occupato: boolean;
  onSpunta: (id: string, stato: StatoCompito) => void;
}

/** "Ti aiuta la lezione … · Dal minuto 20:03": la classe Skool con cui fare il sotto-compito e la nota del team. */
function LezioneDelCompito({ url, nota, lezione }: { url: string; nota: string | null; lezione: LezioneLink | undefined }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/60 py-1 pr-2 pl-1.5 text-xs text-foreground transition-colors hover:bg-muted pointer-coarse:min-h-9"
    >
      <GraduationCap className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {/* Sul telefono il titolo va a capo invece di troncarsi (una riga nowrap allargherebbe tutta la pagina). */}
      <span className="truncate max-sm:whitespace-normal">
        <span className="text-muted-foreground">Ti aiuta la lezione </span>
        <span className="font-medium">{lezione ? `«${lezione.titolo}»` : "su Skool"}</span>
        {nota ? <span className="text-muted-foreground"> · {nota}</span> : null}
      </span>
      <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden />
    </a>
  );
}

/** «Fallo qui: Offerta»: la pagina dell'area dove si fa il sotto-compito. */
function PaginaDelCompito({ chiave }: { chiave: string }) {
  const pagina = paginaArea(chiave);
  if (!pagina) return null;
  return (
    <Link
      to={pagina.percorso}
      className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-foreground/15 py-1 pr-2 pl-1.5 text-xs text-foreground transition-colors hover:bg-muted pointer-coarse:min-h-9"
    >
      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {/* Sul telefono il titolo va a capo invece di troncarsi (una riga nowrap allargherebbe tutta la pagina). */}
      <span className="truncate max-sm:whitespace-normal">
        <span className="text-muted-foreground">Fallo qui: </span>
        <span className="font-medium">{pagina.titolo}</span>
      </span>
    </Link>
  );
}

function RigaSpunta({
  compito,
  etichetta,
  lezioni,
  occupato,
  onSpunta,
}: { compito: Compito; etichetta: string } & Pick<DettaglioTappaProps, "lezioni" | "occupato" | "onSpunta">) {
  const fatto = eFatto(compito);
  const id = `spunta-${compito.id}`;
  return (
    <li className="flex items-start gap-3 py-3">
      <Checkbox
        id={id}
        checked={fatto}
        disabled={occupato}
        onCheckedChange={(checked) => onSpunta(compito.id, checked === true ? "fatto" : "da_fare")}
        className="mt-0.5 size-5 [&_svg]:size-4"
        aria-label={fatto ? "Segna da fare" : "Segna fatto"}
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className={`block cursor-pointer text-[15px] leading-snug transition-colors ${fatto ? "text-muted-foreground line-through" : ""}`}>
          <span className="whitespace-pre-wrap">{etichetta}</span>
          {fatto && compito.completato_il ? <span className="mt-0.5 block text-xs no-underline">Fatto il {formatDate(compito.completato_il)}</span> : null}
        </label>
        {compito.pagina || compito.link_skool ? (
          <div className="flex flex-wrap gap-x-2">
            {compito.pagina ? <PaginaDelCompito chiave={compito.pagina} /> : null}
            {compito.link_skool ? <LezioneDelCompito url={compito.link_skool} nota={compito.nota_skool} lezione={lezioni.get(compito.link_skool)} /> : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/** La tappa al centro della linea del tempo: titolo, avanzamento e i sotto-compiti da spuntare. */
export function DettaglioTappa({ tappa, numero, totale, direzione, lezioni, occupato, onSpunta }: DettaglioTappaProps) {
  const fatta = eFatto(tappa);
  const av = avanzamento(tappa);
  const percento = Math.round((av.fatti / av.totale) * 100);
  const stato = fatta ? { variante: "active" as const, testo: "Completata" } : av.fatti > 0 ? { variante: "neutral" as const, testo: "In corso" } : { variante: "outline" as const, testo: "Da iniziare" };

  return (
    <article
      // marmo-tappe-scheda: movimento minimo anche con "riduci movimento" attivo (index.css); entra dal lato verso cui si va.
      className={`marmo-tappe-scheda grid min-w-0 gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:p-6 animate-in fade-in fill-mode-both duration-400 ease-out ${
        direzione === "avanti" ? "slide-in-from-right-6 motion-reduce:slide-in-from-right-2" : "slide-in-from-left-6 motion-reduce:slide-in-from-left-2"
      }`}
    >
      <header className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow">
            Tappa {numero} di {totale}
          </p>
          <Badge variant={stato.variante} dot>
            {stato.testo}
          </Badge>
        </div>
        <h3 className={`text-[26px] leading-tight ${fatta ? "text-muted-foreground" : ""}`}>{tappa.testo}</h3>
        {fatta && tappa.completato_il ? <p className="text-sm text-muted-foreground">Completata il {formatDate(tappa.completato_il)}</p> : null}
      </header>

      <div className="grid gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{tappa.figli.length > 0 ? "Sotto-compiti" : "Da fare"}</span>
          <span className="figure">
            {av.fatti}/{av.totale}
          </span>
        </div>
        <Progress value={percento} aria-label={`Avanzamento della tappa: ${percento}%`} />
      </div>

      <ul className="min-w-0 divide-y">
        {tappa.figli.length > 0 ? (
          tappa.figli.map((f) => <RigaSpunta key={f.id} compito={f} etichetta={f.testo} lezioni={lezioni} occupato={occupato} onSpunta={onSpunta} />)
        ) : (
          <RigaSpunta compito={tappa} etichetta="Segna la tappa come fatta" lezioni={lezioni} occupato={occupato} onSpunta={onSpunta} />
        )}
      </ul>
    </article>
  );
}
