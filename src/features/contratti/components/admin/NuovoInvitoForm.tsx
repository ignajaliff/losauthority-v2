import { useState } from "react";
import { Link } from "react-router-dom";
import { CopiaButton } from "@/features/clienti/components/CopiaButton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { euroContratto } from "@contratti/documento.ts";
import { useCreaInvito, type EsitoInvito } from "../../hooks/useContrattoAzioni";
import { linkContratto, messaggioInvito, type Offerta } from "../../types";

/** Il messaggio pronto con il link, da mandare al cliente (dopo la creazione dell'invito). */
export function InvitoPronto({ esito }: { esito: EsitoInvito }) {
  const link = linkContratto(esito.token);
  const messaggio = messaggioInvito(esito.programma, link);
  return (
    <div className="grid gap-4 rounded-lg border bg-card p-5 shadow-xs">
      <div>
        <h3 className="text-[22px] leading-tight">Invito pronto</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Offerta {esito.offerta}. Manda questo messaggio al cliente: il link resta valido finché non firma o finché non lo annulli.
        </p>
      </div>
      <pre className="rounded-md border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap">{messaggio}</pre>
      <div className="flex flex-wrap gap-2">
        <CopiaButton testo={messaggio} etichetta="Copia messaggio" variant="default" />
        <CopiaButton testo={link} etichetta="Solo link" />
      </div>
      <div className="flex gap-2.5 border-t pt-4">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`/contratti/`} />}>
          Apri il contratto
        </Button>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/contratti" />}>
          Tutti i contratti
        </Button>
      </div>
    </div>
  );
}

/** Nuovo invito: si sceglie l'offerta e basta. I dati del cliente li inserisce lui dal link. */
export function NuovoInvitoForm({ offerte, haFirma }: { offerte: Offerta[]; haFirma: boolean }) {
  const attive = offerte.filter((o) => o.attiva);
  const [offertaId, setOffertaId] = useState(attive[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [esito, setEsito] = useState<EsitoInvito | null>(null);
  const crea = useCreaInvito();

  if (esito) return <InvitoPronto esito={esito} />;

  if (attive.length === 0) {
    return (
      <div className="grid gap-3">
        <StatoVuoto titolo="Nessuna offerta attiva" testo="Creane una: poi qui basta sceglierla." />
        <Button size="sm" className="w-fit" nativeButton={false} render={<Link to="/offerte" />}>
          Vai alle offerte
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        crea.mutate({ offerta_id: offertaId || attive[0].id, note }, { onSuccess: setEsito });
      }}
      className="grid gap-4 rounded-lg border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="invito-offerta">Offerta</Label>
        <select
          id="invito-offerta"
          value={offertaId || attive[0].id}
          onChange={(e) => setOffertaId(e.target.value)}
          className="h-9 rounded-sm border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {attive.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome} · {euroContratto(o.prezzo)} €
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="invito-note">Nota per te (facoltativa)</Label>
        <Input id="invito-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. chiusa in call il 30/09" autoComplete="off" maxLength={1000} />
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        I dati li inserisce il cliente dal link, e sceglie lui se acquista da privato o con partita IVA.{" "}
        {haFirma
          ? "Creando l'invito firmi la proposta: la tua firma salvata compare sul contratto."
          : "Non hai ancora salvato la tua firma: il contratto uscirà senza, e dovrai controfirmarlo a mano."}
      </p>
      <Button type="submit" className="w-full" disabled={crea.isPending}>
        {crea.isPending ? "Creo l'invito…" : haFirma ? "Firma e crea l'invito" : "Crea l'invito"}
      </Button>
    </form>
  );
}
