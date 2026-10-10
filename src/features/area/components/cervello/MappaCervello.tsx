import { ArrowRight, Brain, Shapes, Sparkles, Swords, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

interface Nodo {
  href: string;
  titolo: string;
  testo: string;
  icon: typeof Brain;
}

/** I quattro rami del cervello, da sinistra a destra. */
const NODI: Nodo[] = [
  { href: "/area/cervello/avatar", titolo: "Avatar", testo: "Il tuo cliente ideale: chi è, cosa vuole, cosa lo blocca.", icon: UserRound },
  { href: "/area/cervello/offerta", titolo: "Offerta", testo: "Promessa, struttura e prezzo di quello che vendi.", icon: Sparkles },
  { href: "/area/cervello/concorrenti", titolo: "Competitors", testo: "Chi vende la stessa cosa e chi ti ispira: cosa fanno, cosa dicono, dove sei diverso.", icon: Swords },
  { href: "/area/cervello/kit-brand", titolo: "Kit Brand", testo: "Logo, colori, font, tono di voce e documenti: quello che ti rende riconoscibile.", icon: Shapes },
];

/** Punto d'arrivo delle linee nel viewBox 800×140: il centro di ciascuna delle quattro colonne. */
const ARRIVI = [100, 300, 500, 700];

function NodoCervello({ nodo, indice }: { nodo: Nodo; indice: number }) {
  const Icon = nodo.icon;
  return (
    <Link
      to={nodo.href}
      style={{ animationDelay: `${650 + indice * 110}ms` }}
      // Sotto md: icona a sinistra e testo a destra (righe più basse, le quattro voci stanno quasi in uno schermo); da md la colonna di sempre.
      className="marmo-cervello-nodo group relative grid h-full grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-2xl border bg-card p-4 shadow-xs transition-[transform,box-shadow,border-color] duration-300 animate-in fade-in slide-in-from-top-2 fill-mode-both hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md md:flex md:flex-col md:gap-4 md:p-5"
    >
      {/* Il punto dove atterra la linea (solo da md, dove le linee si vedono). */}
      <span
        aria-hidden
        className="absolute -top-[6px] left-1/2 hidden size-3 -translate-x-1/2 rounded-full border-2 border-card bg-muted-foreground/50 transition-colors duration-300 group-hover:bg-foreground md:block"
      />
      <span className="grid size-10 place-items-center rounded-full bg-muted text-foreground transition-colors duration-300 group-hover:bg-foreground group-hover:text-background">
        <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[22px] leading-tight font-medium">{nodo.titolo}</span>
        <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{nodo.testo}</span>
      </span>
      <span className="col-start-2 mt-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        Apri <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

/**
 * La mappa del "Cervello del tuo branding": il cervello in alto al centro, quattro
 * linee che scendono verso Avatar, Offerta, Concorrenti e Kit Brand. Le linee si
 * disegnano all'ingresso (SVG con pathLength=1), i nodi entrano uno dopo l'altro,
 * l'alone del cervello respira. Sotto md le linee lasciano il posto a una colonna.
 */
export function MappaCervello() {
  return (
    <section aria-label="Mappa del cervello del tuo branding" className="grid">
      <div className="flex justify-center">
        <div className="relative grid size-28 place-items-center">
          <span aria-hidden className="marmo-cervello-respiro absolute inset-2 rounded-full bg-foreground/10 blur-xl" />
          <span className="marmo-cervello-nodo relative grid size-[88px] place-items-center rounded-full border bg-card shadow-sm animate-in fade-in zoom-in-90 fill-mode-both duration-500">
            <Brain className="size-10" strokeWidth={1.25} aria-hidden />
          </span>
        </div>
      </div>

      {/* Le quattro linee: partono dal fondo del cervello e arrivano al centro di ogni colonna. */}
      <svg aria-hidden viewBox="0 0 800 140" preserveAspectRatio="none" className="hidden h-[140px] w-full text-muted-foreground/45 md:block">
        {ARRIVI.map((x, i) => (
          <path
            key={x}
            d={`M400 0 C400 72, ${x} 68, ${x} 140`}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            className="marmo-cervello-linea"
            style={{ animationDelay: `${200 + i * 110}ms` }}
          />
        ))}
      </svg>
      <div aria-hidden className="mx-auto h-8 w-px bg-border md:hidden" />

      <ul className="grid gap-4 md:grid-cols-4">
        {NODI.map((n, i) => (
          <li key={n.href} className="min-w-0">
            <NodoCervello nodo={n} indice={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
