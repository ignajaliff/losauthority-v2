import { useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { eFatto, indiceTappaCorrente, raggruppaTappe, useCambiaStatoCompito, useCompiti } from "@/features/clienti";
import { Button } from "@/shared/components/ui/button";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { useLezioniPerUrl } from "../../hooks/useLezioniPerUrl";
import { DettaglioTappa } from "./DettaglioTappa";
import { PuntoTappa } from "./PuntoTappa";

/**
 * Il piano d'azione del cliente come linea del tempo: un punto per tappa, la
 * tappa "di oggi" al centro con i suoi sotto-compiti sotto, i vicini sfocati.
 * Niente scroll orizzontale: si naviga con le due frecce (o cliccando un punto,
 * o con uno swipe sul telefono) e la riga scivola di uno slot. Quando una
 * tappa si completa il punto diventa verde e la successiva prende il centro.
 */
export function LineaTempoPiano({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useCompiti(clienteId);
  const cambia = useCambiaStatoCompito(clienteId);
  /** Tappa scelta con le frecce; null = quella corrente (la prima non completata). */
  const [scelta, setScelta] = useState<number | null>(null);
  /** Verso dell'ultimo spostamento: il dettaglio entra dal lato verso cui si va. */
  const [direzione, setDirezione] = useState<"avanti" | "indietro">("avanti");
  /** Dove è iniziato il tocco sul binario: sul telefono si passa di tappa anche col dito (swipe). */
  const tocco = useRef<{ x: number; y: number } | null>(null);

  const tappe = raggruppaTappe(data ?? []);
  // Titoli delle lezioni Skool collegate ai sotto-compiti (prima dei return: è un hook).
  const lezioni = useLezioniPerUrl(tappe.flatMap((t) => t.figli.flatMap((f) => (f.link_skool ? [f.link_skool] : []))));

  if (isLoading) return <SkeletonBlocco altezza="h-80" />;
  if (isError) return <ErroreCaricamento />;
  if (tappe.length === 0) {
    return <StatoVuoto titolo="Il piano d'azione arriva dopo la prima call" testo="Wesley e il team lo scrivono con te: qui vedrai le tappe del percorso, una alla volta." />;
  }

  const indice = Math.min(scelta ?? indiceTappaCorrente(tappe), tappe.length - 1);
  const tappa = tappe[indice];
  const fatte = tappe.filter(eFatto).length;

  function vaiA(nuovo: number) {
    setDirezione(nuovo >= indice ? "avanti" : "indietro");
    setScelta(nuovo);
  }

  /** Swipe orizzontale di almeno 40px (e più orizzontale che verticale): tappa dopo o prima. */
  function fineTocco(e: TouchEvent) {
    const inizio = tocco.current;
    const fine = e.changedTouches[0];
    tocco.current = null;
    if (!inizio || !fine) return;
    const dx = fine.clientX - inizio.x;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(fine.clientY - inizio.y)) return;
    const nuovo = indice + (dx < 0 ? 1 : -1);
    if (nuovo >= 0 && nuovo < tappe.length) vaiA(nuovo);
  }

  // min-w-0: un testo lungo dentro la tappa non deve allargare la colonna della pagina.
  return (
    <section aria-label="Piano d'azione" className="grid min-w-0 gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="eyebrow">Piano d'azione</p>
          <p className="text-sm text-muted-foreground">
            {fatte === tappe.length ? "Tutte le tappe completate" : `${fatte} di ${tappe.length} tappe completate`}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Tappa precedente" disabled={indice === 0} onClick={() => vaiA(indice - 1)}>
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Tappa successiva" disabled={indice === tappe.length - 1} onClick={() => vaiA(indice + 1)}>
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      {/* Binario: la riga è più larga del contenitore ma si vede solo la finestra; i bordi sfumano. */}
      <div
        className="@container relative h-36 overflow-hidden [--slot:128px] md:[--slot:176px]"
        style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          tocco.current = t ? { x: t.clientX, y: t.clientY } : null;
        }}
        onTouchEnd={fineTocco}
        onTouchCancel={() => {
          tocco.current = null;
        }}
      >
        <div
          // marmo-tappe-riga: con "riduci movimento" attivo lo scorrimento resta (più corto), vedi index.css.
          className="marmo-tappe-riga absolute inset-y-0 left-0 flex transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(calc(50cqw - var(--slot) * ${indice + 0.5}))` }}
        >
          {tappe.map((t, i) => (
            <PuntoTappa key={t.id} tappa={t} numero={i + 1} distanza={i - indice} ultimo={i === tappe.length - 1} onScegli={() => vaiA(i)} />
          ))}
        </div>
      </div>

      <DettaglioTappa
        key={tappa.id}
        tappa={tappa}
        numero={indice + 1}
        totale={tappe.length}
        direzione={direzione}
        lezioni={lezioni.data ?? new Map()}
        occupato={cambia.isPending}
        // Dopo una spunta si torna alla tappa corrente: se la tappa si è completata, la successiva prende il centro.
        onSpunta={(id, stato) => cambia.mutate({ id, stato }, { onSuccess: () => setScelta(null) })}
      />
    </section>
  );
}
