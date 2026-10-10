import { useState } from "react";
import { Instagram } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { useCollegaInstagram } from "../hooks/useInstagram";

/** Una volta sola: il cliente indica il suo profilo Instagram e parte la prima lettura dei video. */
export function CollegaInstagram({ clienteId }: { clienteId: string }) {
  const collega = useCollegaInstagram(clienteId);
  const [valore, setValore] = useState("");
  const pronto = valore.trim().length >= 2;

  return (
    <Card className="mx-auto max-w-[560px]">
      <CardHeader>
        <p className="eyebrow inline-flex items-center gap-1.5">
          <Instagram className="size-3.5" aria-hidden /> Instagram
        </p>
        <CardTitle className="mt-2">Collega il tuo profilo</CardTitle>
        <CardDescription>
          Leggo gli ultimi video che hai pubblicato e registro visualizzazioni, mi piace e commenti. Poi i numeri si aggiornano da soli ogni 15
          giorni e ogni 30 giorni cerco i video nuovi. Lo fai una volta sola.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pronto && !collega.isPending) collega.mutate(valore.trim());
          }}
        >
          <label htmlFor="instagram-profilo" className="text-sm font-medium">
            Link o nome del profilo
          </label>
          <Input
            id="instagram-profilo"
            placeholder="instagram.com/tuonome oppure @tuonome"
            value={valore}
            disabled={collega.isPending}
            onChange={(e) => setValore(e.target.value)}
            autoComplete="off"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {collega.isPending ? "Leggo il profilo: ci vuole circa un minuto, lascia aperta la pagina." : "Il profilo deve essere pubblico."}
            </p>
            <Button type="submit" disabled={!pronto || collega.isPending}>
              {collega.isPending ? "Leggo…" : "Collega e leggi i video"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
