import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useAggiornaPubblicazione, useEliminaPubblicazione } from "../hooks/usePubblicazioni";
import { formToPubblicazione, pubblicazioneSchema, pubblicazioneToForm, type PubblicazioneFormValues } from "../schema";
import { eInstagram, ETICHETTA_PIATTAFORMA, PIATTAFORME, type Pubblicazione } from "../types";
import { IconaPiattaforma } from "./IconaPiattaforma";

interface PubblicazioneDialogProps {
  clienteId: string;
  /** null → chiuso. */
  pubblicazione: Pubblicazione | null;
  onChiudi: () => void;
}

/**
 * Popup «Modifica pubblicazione». Le carte Instagram arrivano dalla sincronizzazione:
 * si cambiano solo nome e note e non si eliminano (tornerebbero al giro successivo).
 */
export function PubblicazioneDialog({ clienteId, pubblicazione, onChiudi }: PubblicazioneDialogProps) {
  return (
    <Dialog open={pubblicazione !== null} onOpenChange={(open) => (open ? null : onChiudi())}>
      <DialogContent>
        {pubblicazione ? (
          <>
            <DialogHeader>
              <DialogTitle>Modifica pubblicazione</DialogTitle>
              <DialogDescription>
                {eInstagram(pubblicazione)
                  ? "Il video viene da Instagram: puoi cambiare il nome che vedi qui e le note. Piattaforma, data e numeri li tiene aggiornati la sincronizzazione."
                  : "Nome, piattaforme e data del video pubblicato."}
              </DialogDescription>
            </DialogHeader>
            <PubblicazioneForm key={pubblicazione.id} clienteId={clienteId} pubblicazione={pubblicazione} onChiudi={onChiudi} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PubblicazioneForm({ clienteId, pubblicazione, onChiudi }: { clienteId: string; pubblicazione: Pubblicazione; onChiudi: () => void }) {
  const salva = useAggiornaPubblicazione(clienteId);
  const elimina = useEliminaPubblicazione(clienteId);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const soloTesti = eInstagram(pubblicazione);
  const form = useForm<PubblicazioneFormValues>({
    resolver: zodResolver(pubblicazioneSchema),
    defaultValues: pubblicazioneToForm(pubblicazione),
  });
  const occupato = salva.isPending || elimina.isPending;

  function onSubmit(values: PubblicazioneFormValues) {
    const dati = formToPubblicazione(values);
    salva.mutate(
      { id: pubblicazione.id, dati: soloTesti ? { titolo: dati.titolo, note: dati.note } : dati },
      { onSuccess: onChiudi },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="titolo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome della pubblicazione *</FormLabel>
              <FormControl>
                <Input placeholder="Es. 3 errori che fai quando pubblichi un reel" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {soloTesti ? null : (
          <>
            <FormField
              control={form.control}
              name="piattaforme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dove l'hai pubblicato *</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {PIATTAFORME.map((x) => {
                      const attivo = field.value.includes(x);
                      return (
                        <label key={x} className="inline-flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={attivo}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? [...field.value, x] : field.value.filter((v) => v !== x))
                            }
                          />
                          <IconaPiattaforma piattaforma={x} className="size-4" />
                          {ETICHETTA_PIATTAFORMA[x]}
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pubblicata_il"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pubblicato il</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Cosa ha funzionato, cosa cambieresti…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="sm:justify-between">
          {soloTesti ? (
            <span />
          ) : (
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={occupato} onClick={() => setConfermaElimina(true)}>
              <Trash2 aria-hidden /> Elimina
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={occupato} onClick={onChiudi}>
              Annulla
            </Button>
            <Button type="submit" disabled={occupato}>
              {salva.isPending ? "Salvo…" : "Salva"}
            </Button>
          </div>
        </DialogFooter>
      </form>

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la pubblicazione?</AlertDialogTitle>
            <AlertDialogDescription>"{pubblicazione.titolo}" e tutte le sue rilevazioni verranno rimosse.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elimina.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => elimina.mutate(pubblicazione.id, { onSuccess: () => { setConfermaElimina(false); onChiudi(); } })}
            >
              {elimina.isPending ? "Elimino…" : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
