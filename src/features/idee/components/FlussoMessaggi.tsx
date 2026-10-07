import { useEffect, useRef } from "react";
import { Palette, RotateCcw, TrendingUp } from "lucide-react";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { Button } from "@/shared/components/ui/button";
import type { Idea, Messaggio, Stile } from "../types";
import { CardIdea } from "./CardIdea";
import { PensieroAura } from "./PensieroAura";

interface FlussoMessaggiProps {
  messaggi: Messaggio[];
  idee: Idea[];
  /** Gli stili del cliente, per mostrare quale è stato richiamato in un messaggio. */
  stili?: Stile[];
  /** Messaggio appena inviato e non ancora arrivato dal server: lo mostriamo subito con Aura che pensa. */
  pendente: string | null;
  /** Stile agganciato al messaggio pendente. */
  pendenteStile?: string | null;
  /** Le ricerche TikTok del cliente (id → tema), per mostrare quale è stata usata in un messaggio. */
  ricerche?: Array<{ id: string; tema: string }>;
  /** Tema della ricerca TikTok agganciata al messaggio pendente. */
  pendenteRicerca?: string | null;
  occupato: boolean;
  onRiprova: (messaggio: Messaggio) => void;
  onSalva: (idea: Idea) => void;
  onScarta: (idea: Idea) => void;
  onWorkflow: (idea: Idea) => void;
}

function BollaCliente({ testo, stile, ricerca }: { testo: string; stile?: string | null; ricerca?: string | null }) {
  return (
    <div className="flex flex-col items-end gap-1">
      {ricerca ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <TrendingUp className="size-3" aria-hidden /> Ricerca TikTok · {ricerca}
        </span>
      ) : null}
      {stile ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Palette className="size-3" aria-hidden /> Stile · {stile}
        </span>
      ) : null}
      <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-primary-foreground">
        {testo}
      </p>
    </div>
  );
}

/** La conversazione: il cliente a destra, Aura a sinistra con le sue proposte sotto ogni risposta. */
export function FlussoMessaggi({
  messaggi,
  idee,
  stili = [],
  pendente,
  pendenteStile = null,
  ricerche = [],
  pendenteRicerca = null,
  occupato,
  onRiprova,
  onSalva,
  onScarta,
  onWorkflow,
}: FlussoMessaggiProps) {
  const titoloStile = (id: string | null) => (id ? (stili.find((s) => s.id === id)?.titolo ?? null) : null);
  const temaRicerca = (id: string | null) => (id ? (ricerche.find((r) => r.id === id)?.tema ?? null) : null);
  const fineRef = useRef<HTMLDivElement>(null);
  const ultimoId = messaggi.at(-1)?.id;
  const ultimoStato = messaggi.at(-1)?.stato;

  // Scorriamo SOLO il contenitore della chat: scrollIntoView in Safari trascina anche gli antenati
  // (griglia con overflow hidden, finestra) e la conversazione finisce fuori vista.
  useEffect(() => {
    const fine = fineRef.current;
    const contenitore = fine?.closest<HTMLElement>("[data-chat-scroll]");
    if (contenitore) contenitore.scrollTo({ top: contenitore.scrollHeight, behavior: "smooth" });
    else fine?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ultimoId, ultimoStato, idee.length, pendente]);

  return (
    <div className="grid gap-6">
      {messaggi.map((m) => {
        if (m.ruolo === "cliente") return <BollaCliente key={m.id} testo={m.contenuto} stile={titoloStile(m.stile_id)} ricerca={temaRicerca(m.ricerca_id)} />;
        const proposte = idee.filter((i) => i.messaggio_id === m.id);
        return (
          <div key={m.id} className="grid gap-4">
            {m.stato === "in_corso" ? (
              <PensieroAura />
            ) : (
              <div className="flex items-start gap-3">
                <AuraSfera dimensione={32} conNome={false} className="mt-0.5" />
                <div className="min-w-0 flex-1 pt-1">
                  {m.stato === "completato" && m.contenuto ? (
                    <p className="font-display text-[19px] leading-snug text-foreground whitespace-pre-wrap">{m.contenuto}</p>
                  ) : null}
                  {m.stato === "errore" ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-muted-foreground">Aura non è riuscita a rispondere{m.errore ? ` (${m.errore.toLowerCase()})` : ""}.</p>
                      <Button size="sm" variant="outline" disabled={occupato} onClick={() => onRiprova(m)}>
                        <RotateCcw aria-hidden /> Riprova
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            {proposte.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 md:pl-11 xl:grid-cols-3">
                {proposte.map((idea, i) => (
                  <CardIdea key={idea.id} idea={idea} indice={i} occupato={occupato} onSalva={onSalva} onScarta={onScarta} onWorkflow={onWorkflow} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      {pendente !== null ? (
        <>
          {pendente ? <BollaCliente testo={pendente} stile={pendenteStile} ricerca={pendenteRicerca} /> : null}
          <PensieroAura />
        </>
      ) : null}

      <div ref={fineRef} />
    </div>
  );
}
