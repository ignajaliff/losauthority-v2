import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { todayIso } from "@/shared/utils/formatDate";
import { useAggiungiFattura } from "../hooks/useFattureMutations";
import { fatturaSchema, type FatturaValues } from "../schema";

interface FatturaFormProps {
  clienteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function valoriIniziali(): FatturaValues {
  return { descrizione: "", importo: "", emessa_il: todayIso(), prossimo_pagamento: "", note: "", pdf: undefined };
}

/** Dialog "Aggiungi fattura": descrizione, importo, date, note e PDF facoltativo. */
export function FatturaForm({ clienteId, open, onOpenChange }: FatturaFormProps) {
  const aggiungi = useAggiungiFattura(clienteId);
  const form = useForm<FatturaValues>({
    resolver: zodResolver(fatturaSchema),
    defaultValues: valoriIniziali(),
  });

  function chiudi(aperto: boolean) {
    if (!aperto) form.reset(valoriIniziali());
    onOpenChange(aperto);
  }

  function onSubmit(values: FatturaValues) {
    aggiungi.mutate(values, { onSuccess: () => chiudi(false) });
  }

  return (
    <Dialog open={open} onOpenChange={chiudi}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi fattura</DialogTitle>
          <DialogDescription>Il PDF è facoltativo e resta privato: si apre solo con un link temporaneo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="descrizione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Input placeholder="Percorso Los Authority" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="importo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo (€)</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="decimal" min="0" step="0.01" placeholder="1500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emessa_il"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emessa il</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="prossimo_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scadenza pagamento (facoltativa)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note interne (non le vede il cliente)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pdf"
              render={({ field: { onChange, name, onBlur, ref } }) => (
                <FormItem>
                  <FormLabel>PDF fattura (facoltativo, max 10 MB)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="application/pdf"
                      name={name}
                      ref={ref}
                      onBlur={onBlur}
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => chiudi(false)} disabled={aggiungi.isPending}>
                Annulla
              </Button>
              <Button type="submit" disabled={aggiungi.isPending}>
                {aggiungi.isPending ? "Salvo…" : "Aggiungi fattura"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
