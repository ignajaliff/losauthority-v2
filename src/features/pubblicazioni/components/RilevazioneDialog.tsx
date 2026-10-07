import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useAggiungiRilevazione } from "../hooks/usePubblicazioni";
import { formToRilevazione, rilevazioneIniziale, rilevazioneSchema, type RilevazioneFormValues } from "../schema";
import { CAMPI_METRICA, ETICHETTA_CAMPO_METRICA, ETICHETTA_PIATTAFORMA, PIATTAFORME, type Piattaforma, type Pubblicazione } from "../types";

const PIATTAFORMA_ITEMS: Record<string, string> = { ...ETICHETTA_PIATTAFORMA };

interface RilevazioneDialogProps {
  clienteId: string;
  /** null → chiuso. */
  bersaglio: { pubblicazione: Pubblicazione; piattaforma: Piattaforma } | null;
  onChiudi: () => void;
}

/** Popup "Aggiungi rilevazione": data/ora e i tre numeri della piattaforma scelta. */
export function RilevazioneDialog({ clienteId, bersaglio, onChiudi }: RilevazioneDialogProps) {
  return (
    <Dialog open={bersaglio !== null} onOpenChange={(open) => (open ? null : onChiudi())}>
      <DialogContent>
        {bersaglio ? (
          <RilevazioneForm
            key={`${bersaglio.pubblicazione.id}-${bersaglio.piattaforma}`}
            clienteId={clienteId}
            pubblicazione={bersaglio.pubblicazione}
            piattaforma={bersaglio.piattaforma}
            onChiudi={onChiudi}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface RilevazioneFormProps {
  clienteId: string;
  pubblicazione: Pubblicazione;
  piattaforma: Piattaforma;
  onChiudi: () => void;
}

function RilevazioneForm({ clienteId, pubblicazione, piattaforma, onChiudi }: RilevazioneFormProps) {
  const aggiungi = useAggiungiRilevazione(clienteId);
  const form = useForm<RilevazioneFormValues>({
    resolver: zodResolver(rilevazioneSchema),
    defaultValues: rilevazioneIniziale(piattaforma),
  });

  function onSubmit(values: RilevazioneFormValues) {
    aggiungi.mutate({ pubblicazioneId: pubblicazione.id, dati: formToRilevazione(values) }, { onSuccess: onChiudi });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nuova rilevazione</DialogTitle>
        <DialogDescription>
          "{pubblicazione.titolo}". Segna i numeri di adesso: potrai confrontarli con le rilevazioni successive.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="piattaforma"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Piattaforma</FormLabel>
                  <Select value={field.value} items={PIATTAFORMA_ITEMS} onValueChange={(v) => field.onChange(v ?? piattaforma)}>
                    <FormControl>
                      <SelectTrigger className="w-full" onBlur={field.onBlur}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PIATTAFORME.map((x) => (
                        <SelectItem key={x} value={x}>
                          {ETICHETTA_PIATTAFORMA[x]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rilevata_il"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e ora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {CAMPI_METRICA.map((c, i) => (
              <FormField
                key={c}
                control={form.control}
                name={c}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{ETICHETTA_CAMPO_METRICA[c]}</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="0" autoFocus={i === 0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={aggiungi.isPending} onClick={onChiudi}>
              Annulla
            </Button>
            <Button type="submit" disabled={aggiungi.isPending}>
              {aggiungi.isPending ? "Salvo…" : "Salva rilevazione"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
