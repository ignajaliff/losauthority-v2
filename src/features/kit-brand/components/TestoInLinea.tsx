import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TestoInLineaProps {
  valore: string | null | undefined;
  /** Cosa si vede quando è vuoto (in corsivo, attenuato): invita a scrivere. */
  segnaposto: string;
  onSalva: (valore: string) => void;
  /** Più righe (Invio va a capo, salva su blur o ⌘/Ctrl+Invio); altrimenti Invio salva. */
  multiriga?: boolean;
  maxLength: number;
  /** Classi del testo mostrato E del campo: così la scrittura avviene nello stesso corpo tipografico. */
  className?: string;
  /** Etichetta per chi usa lo screen reader. */
  etichetta: string;
  /** Stile in linea del testo (es. la font del brand). */
  stile?: React.CSSProperties;
  disabilitato?: boolean;
}

/**
 * Un testo del libro di marca che si modifica toccandolo: niente popup, niente
 * bordi finché non si scrive. Salva al blur (o Invio) solo se è cambiato.
 */
export function TestoInLinea({ valore, segnaposto, onSalva, multiriga = false, maxLength, className, etichetta, stile, disabilitato }: TestoInLineaProps) {
  const [inModifica, setInModifica] = useState(false);
  const [bozza, setBozza] = useState(valore ?? "");
  /** Sul touch il campo non scende sotto i 16px: con meno, iOS ingrandisce la pagina appena si tocca. */
  const [almeno16, setAlmeno16] = useState(false);
  const campo = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (inModifica) {
      campo.current?.focus();
      const n = campo.current?.value.length ?? 0;
      campo.current?.setSelectionRange(n, n);
    }
  }, [inModifica]);

  function chiudi(salva: boolean) {
    setInModifica(false);
    const nuovo = bozza.trim();
    if (salva && nuovo !== (valore ?? "").trim()) onSalva(nuovo);
    else setBozza(valore ?? "");
  }

  const classiCampo = cn(
    "w-full resize-none bg-transparent outline-none ring-0 placeholder:text-muted-foreground/60",
    "rounded-sm -mx-1 px-1 box-content border-b border-dashed border-foreground/40 focus:border-foreground",
    // Sul touch una riga sola è alta almeno 36px (come il testo mostrato): si prende col dito e non salta.
    !multiriga && "pointer-coarse:min-h-9",
    className,
  );

  if (inModifica) {
    const comuni = {
      value: bozza,
      maxLength,
      "aria-label": etichetta,
      style: almeno16 ? { ...stile, fontSize: 16 } : stile,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setBozza(e.target.value),
      onBlur: () => chiudi(true),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Escape") chiudi(false);
        if (e.key === "Enter" && (!multiriga || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          chiudi(true);
        }
      },
    };
    return multiriga ? (
      <textarea ref={campo as React.RefObject<HTMLTextAreaElement>} rows={Math.max(3, bozza.split("\n").length)} className={cn(classiCampo, "field-sizing-content")} {...comuni} />
    ) : (
      <input ref={campo as React.RefObject<HTMLInputElement>} type="text" className={classiCampo} {...comuni} />
    );
  }

  const vuoto = !valore?.trim();
  return (
    <button
      type="button"
      disabled={disabilitato}
      onClick={(e) => {
        const corpo = parseFloat(getComputedStyle(e.currentTarget).fontSize);
        setAlmeno16(corpo < 16 && window.matchMedia("(pointer: coarse)").matches);
        setBozza(valore ?? "");
        setInModifica(true);
      }}
      aria-label={`${etichetta}: ${vuoto ? "scrivi" : "modifica"}`}
      style={stile}
      className={cn(
        "block w-full cursor-text rounded-sm text-left transition-colors hover:bg-foreground/[0.04] disabled:cursor-default disabled:hover:bg-transparent",
        "-mx-1 box-content px-1",
        !multiriga && "pointer-coarse:min-h-9",
        vuoto && "text-muted-foreground/70 italic",
        multiriga && "whitespace-pre-wrap",
        className,
      )}
    >
      {vuoto ? segnaposto : valore}
    </button>
  );
}
