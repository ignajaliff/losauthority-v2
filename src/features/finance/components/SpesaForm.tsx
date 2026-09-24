import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { todayIso } from "@/shared/utils/formatDate";
import { useAggiungiSpesa } from "../hooks/useSpese";
import { spesaSchema, type SpesaValues } from "../schema";
import type { TipoSpesa } from "../types";

interface SpesaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoIniziale?: TipoSpesa;
}

const TIPI: Record<TipoSpesa, string> = {
  variabile: "Variabile (una tantum)",
  fissa: "Fissa (ogni mese)",
};

function valoriIniziali(tipo: TipoSpesa): SpesaValues {
  return { descrizione: "", importo: "", tipo, data: todayIso() };
}

/** Dialog "Aggiungi spesa": descrizione, importo, tipo fissa/variabile, data. */
export function SpesaForm({ open, onOpenChange, tipoIniziale = "variabile" }: SpesaFormProps) {
  const aggiungi = useAggiungiSpesa();
  const form = useForm<SpesaValues>({ resolver: zodResolver(spesaSchema), defaultValues: valoriIniziali(tipoIniziale) });
  const tipo = form.watch("tipo");

  function chiudi(aperto: boolean) {
    if (!aperto) form.reset(valoriIniziali(tipoIniziale));
    onOpenChange(aperto);
  }

  function onSubmit(values: SpesaValues) {
    aggiungi.mutate(values, { onSuccess: () => chiudi(false) });
  }

  return (
    <Dialog open={open} onOpenChange={chiudi}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi spesa</DialogTitle>
          <DialogDescription>
            Le spese fisse contano ogni mese nel totale (puoi sospenderle); le variabili valgono solo per la loro data.
          </DialogDescription>
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
                    <Input placeholder="Affitto ufficio, Canva, ads…" {...field} />
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
                      <Input type="number" inputMode="decimal" min="0" step="0.01" placeholder="49.90" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select items={TIPI} value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(TIPI) as TipoSpesa[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPI[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tipo === "fissa" ? "Attiva dal" : "Data"}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                {aggiungi.isPending ? "Salvo…" : "Aggiungi spesa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
