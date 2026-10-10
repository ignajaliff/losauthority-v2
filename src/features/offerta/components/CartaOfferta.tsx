import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { codiceOfferta, ETICHETTA_POSIZIONAMENTO, haStruttura, rigaCodice, type Offerta } from "../types";
import { StrutturaOfferta } from "./StrutturaOfferta";

interface CartaOffertaProps {
  offerta: Offerta;
  numero: number;
  /** "Nome del cliente": chi possiede l'offerta. */
  titolare: string;
  /** Aura sta ancora costruendo: i campi vuoti pulsano piano. */
  inCompilazione: boolean;
  /** Link alla vista di stampa (si apre in una scheda nuova e propone "Salva come PDF"). */
  linkPdf?: string;
  /** Struttura in griglia larga (vista del team) invece che in colonna (accanto alla chat). */
  larga?: boolean;
}

/** Un campo del fronte: etichetta piccola e valore; vuoto = trattino (che pulsa mentre Aura costruisce). */
function Campo({ etichetta, valore, inCompilazione, className }: { etichetta: string; valore: string | null | undefined; inCompilazione: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="eyebrow text-[10px]">{etichetta}</p>
      {valore ? (
        <p key={valore} title={valore} className="mt-0.5 line-clamp-3 text-[15px] leading-snug text-foreground animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500">
          {valore}
        </p>
      ) : (
        <p className={cn("mt-0.5 text-[15px] leading-snug text-muted-foreground/50", inCompilazione && "animate-pulse")}>
          <span aria-hidden>—</span>
          <span className="sr-only">Non ancora compilato</span>
        </p>
      )}
    </div>
  );
}

/**
 * La carta dell'offerta: in alto il titolo (nome, per chi, prezzo, tipo), la
 * trasformazione promessa e la frase di presentazione; sotto, tutta la
 * struttura costruita con Aura (lettura, ostacoli, stack, prezzo, bordi, scala,
 * potenziatori, obiezioni, prova di mercato). In fondo, "Scarica PDF".
 */
export function CartaOfferta({ offerta, numero, titolare, inCompilazione, linkPdf, larga = false }: CartaOffertaProps) {
  const posizionamento = offerta.posizionamento ? ETICHETTA_POSIZIONAMENTO[offerta.posizionamento] : null;
  const struttura = haStruttura(offerta);
  return (
    <article aria-label={`Offerta ${offerta.nome ?? "in costruzione"}`} className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <p className="eyebrow text-[10px] text-foreground">Offerta · La tua proposta</p>
        <div className="flex shrink-0 items-center gap-3">
          {posizionamento ? (
            <Badge key={posizionamento} variant="outline" className="animate-in fade-in fill-mode-both duration-500">
              {posizionamento}
            </Badge>
          ) : null}
          <p className="figure text-[11px] text-muted-foreground">N. {codiceOfferta(numero)}</p>
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:p-6">
        <div>
          <p className="eyebrow text-[10px]">Nome dell'offerta</p>
          {offerta.nome ? (
            <h3 key={offerta.nome} className="text-[clamp(28px,3vw,40px)] leading-[1.08] break-words animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500">
              {offerta.nome}
            </h3>
          ) : (
            <p className={cn("font-display text-[30px] leading-tight text-muted-foreground/50", inCompilazione && "animate-pulse")}>In costruzione…</p>
          )}
        </div>

        <div className={cn("grid gap-4 sm:grid-cols-2", larga && "lg:grid-cols-4")}>
          <Campo etichetta="Per chi" valore={offerta.per_chi} inCompilazione={inCompilazione} />
          <Campo etichetta="Prezzo" valore={offerta.prezzo} inCompilazione={inCompilazione} />
          <Campo etichetta="Cos'è" valore={offerta.tipo} inCompilazione={inCompilazione} />
          <Campo etichetta="Titolare" valore={titolare} inCompilazione={false} />
        </div>

        <div>
          <p className="eyebrow text-[10px]">La trasformazione</p>
          {offerta.trasformazione ? (
            <p key={offerta.trasformazione} className="mt-1 font-display text-[22px] leading-snug italic text-foreground/90 animate-in fade-in fill-mode-both duration-700">
              «{offerta.trasformazione}»
            </p>
          ) : (
            <p className={cn("mt-1 font-display text-[20px] italic text-muted-foreground/40", inCompilazione && "animate-pulse")}>«…»</p>
          )}
        </div>

        {offerta.frase_presentazione ? (
          <Campo etichetta="Come ti presenti" valore={offerta.frase_presentazione} inCompilazione={false} />
        ) : null}
        {offerta.snapshot ? (
          <div key={offerta.snapshot} className="animate-in fade-in fill-mode-both duration-500">
            <p className="eyebrow text-[10px]">In ascensore</p>
            <p className="mt-0.5 text-[15px] leading-relaxed whitespace-pre-wrap">{offerta.snapshot}</p>
          </div>
        ) : null}

        {struttura ? (
          <>
            <hr className="border-dashed" />
            <StrutturaOfferta offerta={offerta} larga={larga} />
          </>
        ) : (
          <p className="rounded-md bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            La struttura (ostacoli, componenti, prezzo, bordi, scala, garanzia) compare qui man mano che Aura la propone e tu la correggi.
          </p>
        )}
      </div>

      <footer className="flex items-center justify-between gap-4 border-t bg-muted/40 px-5 py-2.5">
        <p className="figure min-w-0 truncate text-[11px] tracking-[0.14em] text-muted-foreground" aria-hidden>
          {rigaCodice(offerta)}
        </p>
        {linkPdf ? (
          <a
            href={linkPdf}
            target="_blank"
            rel="noopener"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-foreground transition-colors hover:text-foreground/70 pointer-coarse:-my-2.5 pointer-coarse:py-2.5"
          >
            <FileDown className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
            Scarica PDF
          </a>
        ) : null}
      </footer>
    </article>
  );
}

