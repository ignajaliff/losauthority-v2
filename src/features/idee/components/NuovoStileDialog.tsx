import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { formToStile, NUOVO_STILE_INIZIALE, nuovoStileSchema, type NuovoStileFormValues } from "../schema";
import { MAX_SCRIPT_STILE } from "../types";

interface NuovoStileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Riceve titolo + script puliti: la pagina li manda ad Aura e chiude il popup. */
  onInvia: (dati: ReturnType<typeof formToStile>) => void;
}

/** Popup "Nuovo stile": nome, gli script dello stesso stile e cosa piace di quello stile. Gli script vanno dritti ad Aura. */
export function NuovoStileDialog({ open, onOpenChange, onInvia }: NuovoStileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Nuovo stile</DialogTitle>
          <DialogDescription>
            Incolla due o più script di video che hanno lo stesso stile. Aura li studia e scrive come rifare quel tipo di video nel tuo nicho: poi lo richiami in
            «Crea idee» scrivendo <span className="font-mono text-foreground">/</span>.
          </DialogDescription>
        </DialogHeader>
        {open ? <NuovoStileForm onInvia={onInvia} onChiudi={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function NuovoStileForm({ onInvia, onChiudi }: { onInvia: NuovoStileDialogProps["onInvia"]; onChiudi: () => void }) {
  const form = useForm<NuovoStileFormValues>({ resolver: zodResolver(nuovoStileSchema), defaultValues: NUOVO_STILE_INIZIALE });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "script" });

  function onSubmit(values: NuovoStileFormValues) {
    onInvia(formToStile(values));
    onChiudi();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 gap-5" noValidate>
        <FormField
          control={form.control}
          name="titolo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome dello stile *</FormLabel>
              <FormControl>
                <Input placeholder="Es. L'errore che fai, Storia di un cliente, Mito da sfatare…" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <fieldset className="grid gap-3">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium">Script di esempio *</legend>
            <Button type="button" size="sm" variant="ghost" disabled={fields.length >= MAX_SCRIPT_STILE} onClick={() => append({ testo: "" })}>
              <Plus aria-hidden /> Aggiungi script
            </Button>
          </div>
          {fields.map((f, i) => (
            <FormField
              key={f.id}
              control={form.control}
              name={`script.${i}.testo`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={i === 0 ? "Incolla qui il testo parlato del primo video…" : "Un altro video dello stesso stile…"}
                        className="field-sizing-fixed min-h-24 wrap-anywhere"
                        {...field}
                      />
                    </FormControl>
                    {fields.length > 1 ? (
                      <Button type="button" size="icon" variant="ghost" aria-label={`Rimuovi script ${i + 1}`} onClick={() => remove(i)}>
                        <X aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormField control={form.control} name="script" render={() => <FormMessage />} />
          <p className="text-xs text-muted-foreground">Più script metti, più Aura capisce cosa si ripete. Anche di altri creator: prende la struttura, non il contenuto.</p>
        </fieldset>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cosa ti piace di questo stile</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Facoltativo. Es. parte sempre da un errore di chi guarda, tono diretto, chiude con una domanda…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="sm:justify-between">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <AuraSfera dimensione={20} conNome={false} />
            Aura ci mette circa mezzo minuto.
          </div>
          {/* Sul telefono i due bottoni si dividono la riga. */}
          <div className="flex gap-2 max-sm:*:flex-1">
            <Button type="button" variant="outline" onClick={onChiudi}>
              Annulla
            </Button>
            <Button type="submit">Manda ad Aura</Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}
