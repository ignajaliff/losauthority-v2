import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import { PERCORSO_INFORMATIVA } from "@contratti/informativa.ts";
import type { TipoCliente } from "@contratti/tipi.ts";
import { TIPI } from "./campi";
import { Spunta } from "./Spunta";

interface PassoInformativaProps {
  programma: string;
  durataMesi: number;
  letta: boolean;
  onLetta: (v: boolean) => void;
  onAvanti: () => void;
}

/** Passo 1: il contratto che sta per firmare e la presa visione dell'informativa privacy. */
export function PassoInformativa({ programma, durataMesi, letta, onLetta, onAvanti }: PassoInformativaProps) {
  return (
    <>
      <h1 className="text-[30px] leading-[1.15]">Il tuo contratto {programma}</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Qui inserisci i tuoi dati, leggi il contratto e lo firmi. Ci vogliono pochi minuti. Tieni a portata di mano il <strong>codice fiscale</strong> e, se
        acquisti con partita IVA, i dati per la fattura.
      </p>
      <div className="flex flex-wrap gap-x-7 gap-y-2.5 rounded-md border bg-card px-4 py-3.5 text-sm text-muted-foreground">
        <span>
          Programma: <strong className="text-foreground">{programma}</strong>
        </span>
        <span>
          Durata: <strong className="text-foreground">{durataMesi} mesi</strong>
        </span>
      </div>
      <p className="text-[15px] font-semibold text-foreground">Prima di tutto, leggi come vengono trattati i tuoi dati.</p>
      <Button variant="outline" className="w-fit" nativeButton={false} render={<a href={PERCORSO_INFORMATIVA} target="_blank" rel="noopener" />}>
        Leggi l'informativa privacy
      </Button>
      <Spunta checked={letta} onChange={onLetta}>
        Ho preso visione dell'informativa sul trattamento dei dati personali.
      </Spunta>
      <Button size="lg" className="w-full" disabled={!letta} onClick={onAvanti}>
        Continua
      </Button>
    </>
  );
}

interface PassoTipoProps {
  tipo: TipoCliente | null;
  dichiaro: boolean;
  onTipo: (t: TipoCliente) => void;
  onDichiaro: (v: boolean) => void;
  onIndietro: () => void;
  onAvanti: () => void;
}

/** Passo 2: come acquista (decide quale contratto firma) e la dichiarazione relativa. */
export function PassoTipo({ tipo, dichiaro, onTipo, onDichiaro, onIndietro, onAvanti }: PassoTipoProps) {
  const scelta = TIPI.find((t) => t.id === tipo) ?? null;
  return (
    <>
      <h1 className="text-[30px] leading-[1.15]">Come acquisti il programma?</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        La scelta decide quale contratto firmi e a chi viene intestata la fattura. Scegli quella che corrisponde davvero alla tua situazione.
      </p>
      <div role="radiogroup" aria-label="Come acquisti" className="grid gap-2.5">
        {TIPI.map((t) => {
          const on = tipo === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onTipo(t.id)}
              className={cn(
                "rounded-md border bg-card px-4.5 py-4 text-left transition-[border-color,box-shadow]",
                on ? "border-foreground shadow-[0_0_0_1px_var(--color-foreground)]" : "border-input hover:border-foreground/40",
              )}
            >
              <span className="block text-base font-bold text-foreground">{t.titolo}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{t.testo}</span>
            </button>
          );
        })}
      </div>
      {scelta ? (
        <Spunta checked={dichiaro} onChange={onDichiaro}>
          {scelta.dichiarazione}
        </Spunta>
      ) : null}
      <div className="flex gap-2.5">
        <Button size="lg" variant="outline" onClick={onIndietro}>
          Indietro
        </Button>
        <Button size="lg" className="flex-1" disabled={!tipo || !dichiaro} onClick={onAvanti}>
          Continua
        </Button>
      </div>
    </>
  );
}
