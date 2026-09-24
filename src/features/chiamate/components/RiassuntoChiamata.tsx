import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

/** Oltre questa lunghezza il riassunto parte chiuso e si apre con "Mostra tutto". */
const SOGLIA_LUNGO = 700;

/** Rende **grassetto** inline. */
function inline(testo: string, key: string): ReactNode {
  return testo.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${key}-${i}`} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${key}-${i}`}>{p}</span>
    ),
  );
}

/**
 * Riassunto Fathom (markdown leggero) reso leggibile: titoli, elenchi, grassetto.
 * I link markdown vengono tolti: puntano alla call privata, la registrazione
 * si apre dal pulsante "Apri su Fathom".
 */
function RiassuntoMarkdown({ markdown }: { markdown: string }) {
  const pulito = markdown.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  const righe: ReactNode[] = [];

  pulito.split("\n").forEach((grezza, i) => {
    const riga = grezza.trim();
    if (!riga) return;
    const key = `r${i}`;

    if (riga.startsWith("## ")) {
      righe.push(
        <p key={key} className="mt-3 font-heading text-base font-medium text-foreground">
          {inline(riga.slice(3), key)}
        </p>,
      );
      return;
    }
    if (riga.startsWith("### ")) {
      righe.push(
        <p key={key} className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {inline(riga.slice(4), key)}
        </p>,
      );
      return;
    }

    const rientro = (grezza.match(/^\s*/)?.[0].length ?? 0) >= 4;
    const puntato = /^\s*[-*]\s+/.test(grezza);
    const numerato = /^\s*\d+\.\s+/.test(grezza);
    if (puntato || numerato) {
      const contenuto = grezza.replace(/^\s*([-*]|\d+\.)\s+/, "");
      righe.push(
        <p key={key} className={`flex gap-2 leading-relaxed ${rientro ? "pl-5" : ""}`}>
          <span className="shrink-0 text-muted-foreground">{numerato ? "›" : "•"}</span>
          <span>{inline(contenuto, key)}</span>
        </p>,
      );
      return;
    }

    righe.push(
      <p key={key} className="leading-relaxed">
        {inline(riga, key)}
      </p>,
    );
  });

  return <div className="grid gap-1 text-sm text-muted-foreground">{righe}</div>;
}

export function RiassuntoChiamata({ riassunto }: { riassunto: string }) {
  const lungo = riassunto.length > SOGLIA_LUNGO;
  const [aperto, setAperto] = useState(!lungo);

  return (
    <section aria-label="Riassunto della call" className="grid gap-2">
      <div className={aperto ? "" : "relative max-h-40 overflow-hidden"}>
        <RiassuntoMarkdown markdown={riassunto} />
        {!aperto && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>
      {lungo && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => setAperto((v) => !v)}
          aria-expanded={aperto}
        >
          {aperto ? <ChevronUp /> : <ChevronDown />}
          {aperto ? "Nascondi riassunto" : "Mostra tutto il riassunto"}
        </Button>
      )}
    </section>
  );
}
