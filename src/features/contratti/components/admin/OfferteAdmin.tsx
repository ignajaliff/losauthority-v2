import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ConfermaEliminazione } from "@/features/fatture";
import { euroContratto } from "@contratti/documento.ts";
import { MODELLI_CONTRATTO, modelloValido } from "@contratti/modelli.ts";
import { useAggiornaOfferta, useCreaOfferta, useEliminaOfferta } from "../../hooks/useOfferte";
import { leggiImporto, type Offerta } from "../../types";

const MODELLI = Object.entries(MODELLI_CONTRATTO).map(([id, m]) => ({ id, nome: m.nome }));
const nomeModello = (id: string) => (modelloValido(id) ? MODELLI_CONTRATTO[id].nome : "Contratto non più disponibile");

/** Una offerta esistente: nome, prezzo e se si può scegliere creando un invito. Gli inviti già creati non cambiano. */
export function OffertaCard({ offerta }: { offerta: Offerta }) {
  const [nome, setNome] = useState(offerta.nome);
  const [prezzo, setPrezzo] = useState(euroContratto(offerta.prezzo));
  const [attiva, setAttiva] = useState(offerta.attiva);
  const [errore, setErrore] = useState<string | null>(null);
  const [conferma, setConferma] = useState(false);
  const aggiorna = useAggiornaOfferta();
  const elimina = useEliminaOfferta();

  function salva() {
    const n = nome.replace(/\s+/g, " ").trim().slice(0, 80);
    const p = leggiImporto(prezzo);
    if (!n) return setErrore("Dai un nome all'offerta.");
    if (!Number.isFinite(p) || p <= 0) return setErrore("Inserisci un prezzo valido.");
    setErrore(null);
    aggiorna.mutate({ id: offerta.id, nome: n, prezzo: p, attiva });
  }

  return (
    <article className="grid gap-3 rounded-lg border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{nomeModello(offerta.modello)}</span>
        <Badge variant={offerta.attiva ? "active" : "neutral"} dot>
          {offerta.attiva ? "Attiva" : "Non attiva"}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`nome-${offerta.id}`}>Nome</Label>
          <Input id={`nome-${offerta.id}`} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`prezzo-${offerta.id}`}>Prezzo (€)</Label>
          <Input id={`prezzo-${offerta.id}`} inputMode="decimal" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={attiva} onChange={(e) => setAttiva(e.target.checked)} className="size-4 accent-foreground" />
        Si può scegliere quando creo un invito
      </label>
      {errore ? (
        <p role="alert" className="text-sm text-status-churn">
          {errore}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <Button size="sm" onClick={salva} disabled={aggiorna.isPending}>
          {aggiorna.isPending ? "Salvo…" : "Salva"}
        </Button>
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setConferma(true)} disabled={elimina.isPending}>
          Elimina
        </Button>
      </div>
      <ConfermaEliminazione
        open={conferma}
        onOpenChange={setConferma}
        titolo={`Eliminare l'offerta «${offerta.nome}»?`}
        descrizione="Gli inviti e i contratti già creati restano come sono."
        onConferma={() => elimina.mutate(offerta.id)}
      />
    </article>
  );
}

/** Nuova offerta: nome, contratto (tra quelli già scritti) e prezzo. */
export function NuovaOffertaForm() {
  const [nome, setNome] = useState("");
  const [modello, setModello] = useState(MODELLI[0]?.id ?? "");
  const [prezzo, setPrezzo] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const crea = useCreaOfferta();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    const n = nome.replace(/\s+/g, " ").trim().slice(0, 80);
    const p = leggiImporto(prezzo);
    if (!n) return setErrore("Dai un nome all'offerta.");
    if (!modelloValido(modello)) return setErrore("Scegli il contratto.");
    if (!Number.isFinite(p) || p <= 0) return setErrore("Inserisci un prezzo valido.");
    setErrore(null);
    crea.mutate(
      { nome: n, modello, prezzo: p },
      {
        onSuccess: () => {
          setNome("");
          setPrezzo("");
        },
      },
    );
  }

  return (
    <form onSubmit={invia} className="grid max-w-[560px] gap-3.5 rounded-lg border bg-card p-5 shadow-xs">
      <h3 className="font-sans text-[15px] font-semibold">Nuova offerta</h3>
      <div className="grid gap-1.5">
        <Label htmlFor="nuova-nome">Nome</Label>
        <Input id="nuova-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. UPSCALE" autoComplete="off" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="nuova-modello">Contratto</Label>
        <select
          id="nuova-modello"
          value={modello}
          onChange={(e) => setModello(e.target.value)}
          className="h-9 rounded-sm border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {MODELLI.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="nuova-prezzo">Prezzo (€)</Label>
        <Input id="nuova-prezzo" inputMode="decimal" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} placeholder="1.997,00" required />
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        I contratti disponibili sono quelli già scritti. Per vendere un programma con un contratto diverso serve prima il suo testo: una volta aggiunto, compare in
        questo elenco.
      </p>
      {errore ? (
        <p role="alert" className="text-sm text-status-churn">
          {errore}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="sm" disabled={crea.isPending}>
          {crea.isPending ? "Salvo…" : "Crea offerta"}
        </Button>
      </div>
    </form>
  );
}
