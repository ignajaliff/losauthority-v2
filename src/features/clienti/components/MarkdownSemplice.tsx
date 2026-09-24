import type { ReactNode } from "react";

/* Renderer minimale (niente librerie): titoli #/##/###, liste - e 1., **grassetto**, `codice`. */

function inline(testo: string): ReactNode[] {
  const parti = testo.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parti.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="rounded bg-muted px-1 text-xs">{p.slice(1, -1)}</code>;
    return p;
  });
}

type Blocco =
  | { tipo: "h"; livello: number; testo: string }
  | { tipo: "ul"; voci: string[] }
  | { tipo: "ol"; voci: string[] }
  | { tipo: "p"; testo: string };

function parse(md: string): Blocco[] {
  const blocchi: Blocco[] = [];
  let paragrafo: string[] = [];
  const chiudiParagrafo = () => {
    if (paragrafo.length) blocchi.push({ tipo: "p", testo: paragrafo.join(" ") });
    paragrafo = [];
  };
  for (const riga of md.split(/\r?\n/)) {
    const r = riga.trim();
    const titolo = /^(#{1,3})\s+(.*)$/.exec(r);
    const puntato = /^[-*]\s+(.*)$/.exec(r);
    const numerato = /^\d+[.)]\s+(.*)$/.exec(r);
    if (!r) {
      chiudiParagrafo();
    } else if (titolo) {
      chiudiParagrafo();
      blocchi.push({ tipo: "h", livello: titolo[1]?.length ?? 1, testo: titolo[2] ?? "" });
    } else if (puntato || numerato) {
      chiudiParagrafo();
      const voce = (puntato ?? numerato)?.[1] ?? "";
      const ultimo = blocchi[blocchi.length - 1];
      if (puntato) {
        if (ultimo?.tipo === "ul") ultimo.voci.push(voce);
        else blocchi.push({ tipo: "ul", voci: [voce] });
      } else if (ultimo?.tipo === "ol") ultimo.voci.push(voce);
      else blocchi.push({ tipo: "ol", voci: [voce] });
    } else {
      paragrafo.push(r);
    }
  }
  chiudiParagrafo();
  return blocchi;
}

export function MarkdownSemplice({ testo }: { testo: string }) {
  return (
    <div className="grid gap-3 text-sm leading-relaxed">
      {parse(testo).map((b, i) => {
        if (b.tipo === "h") {
          const classe = b.livello === 1 ? "text-lg font-semibold" : b.livello === 2 ? "text-base font-semibold" : "text-sm font-semibold";
          return (
            <p key={i} role="heading" aria-level={b.livello + 2} className={`${classe} mt-2`}>
              {inline(b.testo)}
            </p>
          );
        }
        if (b.tipo === "ul" || b.tipo === "ol") {
          const Lista = b.tipo;
          return (
            <Lista key={i} className={`grid gap-1 pl-5 ${b.tipo === "ul" ? "list-disc" : "list-decimal"}`}>
              {b.voci.map((v, j) => (
                <li key={j}>{inline(v)}</li>
              ))}
            </Lista>
          );
        }
        return <p key={i}>{inline(b.testo)}</p>;
      })}
    </div>
  );
}
