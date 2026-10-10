import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLinkFileKit, useLogoKit } from "../hooks/useFileKit";
import type { KitBrandRiga } from "../types";

type Sfondo = "chiaro" | "scuro" | "colore";

interface LienzoLogoProps {
  clienteId: string;
  kit: KitBrandRiga | null;
  /** Il colore primario del brand: il terzo sfondo del lienzo. */
  colorePrimario: string | null;
}

/** Un pulsante nascosto che apre il selettore di file e passa il file scelto. */
function SceltaFile({ accetta, onFile, className, children, etichetta }: { accetta: string; onFile: (f: File) => void; className?: string; children: React.ReactNode; etichetta: string }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()} aria-label={etichetta}>
        {children}
      </button>
      <input
        ref={input}
        type="file"
        accept={accetta}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

const ACCETTA_LOGO = "image/png,image/jpeg,image/webp,image/svg+xml";

/**
 * Il logo su un lienzo a tutta larghezza. Tre sfondi (carta, inchiostro, colore
 * primario) scelti con i tre dischi in alto a destra: sullo sfondo scuro si
 * mostra la versione per sfondo scuro se c'è. Il file si carica toccando il lienzo.
 */
export function LienzoLogo({ clienteId, kit, colorePrimario }: LienzoLogoProps) {
  const [sfondo, setSfondo] = useState<Sfondo>("chiaro");
  const logo = useLogoKit(clienteId, "logo_path");
  const logoScuro = useLogoKit(clienteId, "logo_scuro_path");
  const linkChiaro = useLinkFileKit(kit?.logo_path);
  const linkScuro = useLinkFileKit(kit?.logo_scuro_path);
  const occupato = logo.isPending || logoScuro.isPending;

  const usaScuro = sfondo !== "chiaro" && !!kit?.logo_scuro_path;
  const url = usaScuro ? linkScuro.data : linkChiaro.data;
  const haLogo = !!kit?.logo_path;
  const stileSfondo: React.CSSProperties =
    sfondo === "chiaro" ? { background: "var(--ink-0)" } : sfondo === "scuro" ? { background: "var(--ink-950)" } : { background: colorePrimario ?? "var(--ink-300)" };
  const chiaroSuSfondo = sfondo !== "chiaro";

  const sfondi: Array<{ valore: Sfondo; stile: React.CSSProperties; nome: string }> = [
    { valore: "chiaro", stile: { background: "var(--ink-0)" }, nome: "Su carta" },
    { valore: "scuro", stile: { background: "var(--ink-950)" }, nome: "Su inchiostro" },
    { valore: "colore", stile: { background: colorePrimario ?? "var(--ink-300)" }, nome: "Sul colore primario" },
  ];

  return (
    <figure className="grid gap-3">
      <div className="relative grid min-h-[280px] place-items-center overflow-hidden rounded-2xl border transition-colors duration-500 md:min-h-[360px]" style={stileSfondo}>
        {/* Griglia leggera: dà la sensazione del foglio di lavoro, non di una card. */}
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 opacity-[0.07]", chiaroSuSfondo ? "text-white" : "text-black")}
          style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        {/* Sul touch ogni disco (sempre da 20px) sta in un pulsante da 36px: stessa posizione, più facile da prendere. */}
        <div className="absolute top-4 right-4 flex gap-2 pointer-coarse:top-2 pointer-coarse:right-2 pointer-coarse:gap-0" role="radiogroup" aria-label="Sfondo del logo">
          {sfondi.map((s) => (
            <button
              key={s.valore}
              type="button"
              role="radio"
              aria-checked={sfondo === s.valore}
              title={s.nome}
              aria-label={s.nome}
              onClick={() => setSfondo(s.valore)}
              className="group/disco grid size-5 place-items-center rounded-full pointer-coarse:size-9"
            >
              <span
                aria-hidden
                className={cn(
                  "size-5 rounded-full border-2 transition-transform group-hover/disco:scale-110",
                  sfondo === s.valore ? "scale-110 border-foreground ring-2 ring-background" : "border-foreground/30",
                )}
                style={s.stile}
              />
            </button>
          ))}
        </div>

        {haLogo ? (
          <SceltaFile
            accetta={ACCETTA_LOGO}
            etichetta={usaScuro ? "Sostituisci la versione per sfondo scuro" : "Sostituisci il logo"}
            onFile={(file) => (usaScuro ? logoScuro : logo).mutate({ file, vecchio: usaScuro ? kit?.logo_scuro_path ?? null : kit?.logo_path ?? null })}
            className="group relative grid size-full place-items-center p-10 md:p-16"
          >
            {url ? <img src={url} alt="Logo del brand" className="max-h-[220px] max-w-full object-contain drop-shadow-sm" /> : null}
            <span className={cn("absolute bottom-4 text-[11px] tracking-[0.18em] uppercase opacity-0 transition-opacity group-hover:opacity-70 pointer-coarse:opacity-70", chiaroSuSfondo ? "text-white" : "text-foreground")}>
              Tocca per sostituire
            </span>
          </SceltaFile>
        ) : (
          <SceltaFile
            accetta={ACCETTA_LOGO}
            etichetta="Carica il logo"
            onFile={(file) => logo.mutate({ file, vecchio: null })}
            className={cn("grid place-items-center gap-3 rounded-xl border border-dashed px-10 py-12 text-center transition-colors", chiaroSuSfondo ? "border-white/40 text-white hover:bg-white/10" : "border-foreground/30 text-foreground hover:bg-foreground/5")}
          >
            <ImagePlus className="size-7" aria-hidden />
            <span className="font-display text-2xl">Il tuo logo</span>
            <span className="text-[11px] tracking-[0.18em] uppercase opacity-70">PNG, JPG, WebP o SVG · tocca per caricare</span>
          </SceltaFile>
        )}
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
        <span className="eyebrow text-[10px]">Logo</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {haLogo ? (
            <>
              <SceltaFile
                accetta={ACCETTA_LOGO}
                etichetta={kit?.logo_scuro_path ? "Sostituisci la versione per sfondo scuro" : "Carica la versione per sfondo scuro"}
                onFile={(file) => logoScuro.mutate({ file, vecchio: kit?.logo_scuro_path ?? null })}
                className="underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50 pointer-coarse:min-h-9"
              >
                {kit?.logo_scuro_path ? "Sostituisci la versione per sfondo scuro" : "+ Versione per sfondo scuro"}
              </SceltaFile>
              {kit?.logo_scuro_path ? (
                <button type="button" disabled={occupato} onClick={() => logoScuro.mutate({ file: null, vecchio: kit.logo_scuro_path })} className="underline-offset-4 hover:text-foreground hover:underline pointer-coarse:min-h-9">
                  Togli la versione scura
                </button>
              ) : null}
              <button type="button" disabled={occupato} onClick={() => logo.mutate({ file: null, vecchio: kit?.logo_path ?? null })} className="inline-flex items-center gap-1 underline-offset-4 hover:text-status-churn hover:underline pointer-coarse:min-h-9">
                <Trash2 className="size-3" aria-hidden /> Rimuovi il logo
              </button>
            </>
          ) : (
            <span>Prima il logo principale; poi, se ce l'hai, la versione per sfondo scuro.</span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
