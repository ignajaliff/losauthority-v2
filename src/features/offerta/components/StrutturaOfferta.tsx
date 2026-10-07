import { ElencoDossier, SezioneDossier, TestoDossier } from "@/features/avatar";
import { cn } from "@/lib/utils";
import { sezioniOfferta, type Offerta, type VoceOfferta } from "../types";

/** Una voce "a → b": la parte prima della freccia in evidenza, la risposta dopo. */
function VoceFreccia({ testo }: { testo: string }) {
  const i = testo.indexOf("→");
  if (i === -1) return <>{testo}</>;
  return (
    <>
      <span className="font-medium">{testo.slice(0, i).trim()}</span>
      <span className="mx-1.5 text-muted-foreground" aria-hidden>
        →
      </span>
      <span className="sr-only">, risposta: </span>
      {testo.slice(i + 1).trim()}
    </>
  );
}

function Voce({ voce }: { voce: VoceOfferta }) {
  if (voce.lista) {
    if (voce.freccia) {
      return (
        <ul className="grid gap-1.5 pl-4 list-disc marker:text-muted-foreground/60">
          {voce.lista.map((v) => (
            <li key={v}>
              <VoceFreccia testo={v} />
            </li>
          ))}
        </ul>
      );
    }
    return <ElencoDossier voci={voce.lista} corsivo={voce.corsivo} />;
  }
  return <TestoDossier v={voce.testo ?? null} />;
}

interface StrutturaOffertaProps {
  offerta: Offerta;
  /** Compatta (una colonna, dentro la carta) o larga (griglia, vista del team e stampa). */
  larga?: boolean;
  className?: string;
}

/**
 * Tutta la struttura dell'offerta, sezione per sezione, nell'ordine della scheda
 * del metodo (lettura, inquadramento, ostacoli, stack, prezzo, bordi, scala,
 * potenziatori, obiezioni, prova di mercato, da confermare). Le sezioni vuote
 * non compaiono: la carta cresce mentre Aura propone.
 */
export function StrutturaOfferta({ offerta, larga = false, className }: StrutturaOffertaProps) {
  const sezioni = sezioniOfferta(offerta);
  if (sezioni.length === 0) return null;
  return (
    <div className={cn("grid gap-7", className)}>
      {sezioni.map((s) => (
        <section key={s.titolo} aria-label={s.titolo} className="grid gap-3 break-inside-avoid">
          <h4 className="font-display text-[20px] leading-tight font-medium">{s.titolo}</h4>
          <div className={cn("grid gap-4", larga && s.voci.length > 1 && "sm:grid-cols-2")}>
            {s.voci.map((v) => (
              <SezioneDossier key={v.etichetta} titolo={v.etichetta}>
                <Voce voce={v} />
              </SezioneDossier>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
