import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useModificaSpesa } from "../hooks/useSpese";
import { spesaModificaSchema, type SpesaModificaValues } from "../schema";
import type { Spesa } from "../types";

interface SpesaModificaDialogProps {
  spesa: Spesa | null;
  onClose: () => void;
}

function valoriDa(spesa: Spesa | null): SpesaModificaValues {
  return {
    descrizione: spesa?.descrizione ?? "",
    importo: spesa ? String(spesa.importo) : "",
    data: spesa?.data ?? "",
  };
}

/** Dialog per correggere descrizione, importo e data di una spesa (anche quelle da scontrino). */
export function SpesaModificaDialog({ spesa, onClose }: SpesaModificaDialogProps) {
  const modifica = useModificaSpesa();
  const form = useForm<SpesaModificaValues>({ resolver: zodResolver(spesaModificaSchema), defaultValues: valoriDa(spesa) });

  useEffect(() => {
    form.reset(valoriDa(spesa));
  }, [spesa, form]);

  function onSubmit(values: SpesaModificaValues) {
    if (!spesa) return;
    modifica.mutate({ id: spesa.id, values }, { onSuccess: onClose });
  }

  const fissa = spesa?.tipo === "fissa";

  return (
    <Dialog
      open={spesa !== null}
      onOpenChange={(aperto) => {
        if (!aperto) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Correggi spesa</DialogTitle>
          <DialogDescription>{fissa ? "Spesa fissa: l'importo vale ogni mese dalla data indicata." : "Spesa variabile: vale solo per la sua data."}</DialogDescription>
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
                    <Input {...field} />
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
                    <FormLabel>{fissa ? "Importo mensile (€)" : "Importo (€)"}</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="decimal" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fissa ? "Attiva dal" : "Data"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={modifica.isPending}>
                Annulla
              </Button>
              <Button type="submit" disabled={modifica.isPending}>
                {modifica.isPending ? "Salvo…" : "Salva"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
