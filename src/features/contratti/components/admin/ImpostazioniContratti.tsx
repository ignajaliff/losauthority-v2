import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Firma } from "@contratti/tipi.ts";
import { useSalvaImpostazioni } from "../../hooks/useContratti";
import { useSalvaFirmaFornitore } from "../../hooks/useContrattoAzioni";
import type { ImpostazioniContratti as Impostazioni } from "../../types";
import { FirmaPad } from "../FirmaPad";
import { FirmaSvg } from "../FirmaSvg";

/** La firma di Wesley: compare su ogni contratto che manda. Cambiarla vale solo per gli inviti nuovi. */
function FirmaFornitore({ firma }: { firma: Firma | null }) {
  const [nuova, setNuova] = useState<Firma | null>(null);
  const [rifai, setRifai] = useState(false);
  const salva = useSalvaFirmaFornitore();
  const mostraPad = rifai || !firma;

  return (
    <section className="grid gap-3 rounded-lg border bg-card p-5 shadow-xs">
      <h3 className="font-sans text-[15px] font-semibold">La tua firma</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Compare su ogni contratto che mandi, accanto a quella del cliente. Cambiarla vale solo per gli inviti nuovi: quelli già creati tengono la firma che avevano.
      </p>
      {firma && !mostraPad ? (
        <>
          <div className="rounded-md border bg-muted/40 px-4 py-3">
            <FirmaSvg firma={firma} altezza={78} />
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => setRifai(true)}>
              Sostituisci
            </Button>
          </div>
        </>
      ) : (
        <div className="grid gap-2.5">
          <FirmaPad onChange={setNuova} etichetta="Traccia qui la tua firma" disabled={salva.isPending} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={salva.isPending || !nuova}
              onClick={() => nuova && salva.mutate(nuova, { onSuccess: () => { setRifai(false); setNuova(null); } })}
            >
              {salva.isPending ? "Salvo…" : "Salva la firma"}
            </Button>
            {firma ? (
              <Button variant="ghost" size="sm" onClick={() => setRifai(false)}>
                Tieni quella di prima
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

/** Impostazioni del modulo: la firma di Wesley e i dati che finiscono nei contratti. Solo admin. */
export function ImpostazioniContratti({ impostazioni }: { impostazioni: Impostazioni | null }) {
  const [telefono, setTelefono] = useState(impostazioni?.telefono_fornitore ?? "");
  const [istruzioni, setIstruzioni] = useState(impostazioni?.istruzioni_pagamento ?? "");
  const salva = useSalvaImpostazioni();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FirmaFornitore firma={impostazioni?.firma ?? null} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          salva.mutate({ telefono_fornitore: telefono, istruzioni_pagamento: istruzioni });
        }}
        className="grid gap-3.5 rounded-lg border bg-card p-5 shadow-xs"
      >
        <h3 className="font-sans text-[15px] font-semibold">Nel contratto e dopo la firma</h3>
        <div className="grid gap-1.5">
          <Label htmlFor="imp-telefono">Il tuo telefono (compare tra le parti del contratto)</Label>
          <Input id="imp-telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+39 333 1234567" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="imp-istruzioni">Messaggio dopo la firma, facoltativo (es. come pagare)</Label>
          <Textarea
            id="imp-istruzioni"
            rows={4}
            value={istruzioni}
            onChange={(e) => setIstruzioni(e.target.value)}
            placeholder={"Es. Bonifico a Wesley Caicedo\nIBAN IT00 X000 0000 0000 0000 0000 000\nCausale: Programma UPSCALE"}
          />
        </div>
        <p className="text-[13px] text-muted-foreground">Il telefono vale per tutti i contratti non ancora firmati.</p>
        <div>
          <Button type="submit" size="sm" disabled={salva.isPending}>
            {salva.isPending ? "Salvo…" : "Salva"}
          </Button>
        </div>
      </form>
    </div>
  );
}
