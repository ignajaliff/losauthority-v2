import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useModificaF24 } from "../hooks/useF24";
import { f24Schema, type F24Values } from "../schema";
import type { F24 } from "../types";

interface F24ModificaDialogProps {
  f24: F24 | null;
  onClose: () => void;
}

function valoriDa(f24: F24 | null): F24Values {
  return {
    descrizione: f24?.descrizione ?? "",
    importo: f24?.importo != null ? String(f24.importo) : "",
    scadenza: f24?.scadenza ?? "",
  };
}

/** Dialog per correggere descrizione, importo e scadenza di una rata F24. */
export function F24ModificaDialog({ f24, onClose }: F24ModificaDialogProps) {
  const modifica = useModificaF24();
  const form = useForm<F24Values>({ resolver: zodResolver(f24Schema), defaultValues: valoriDa(f24) });

  useEffect(() => {
    form.reset(valoriDa(f24));
  }, [f24, form]);

  function onSubmit(values: F24Values) {
    if (!f24) return;
    modifica.mutate({ id: f24.id, values }, { onSuccess: onClose });
  }

  return (
    <Dialog
      open={f24 !== null}
      onOpenChange={(aperto) => {
        if (!aperto) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Correggi F24</DialogTitle>
          <DialogDescription>Importo, scadenza e descrizione della rata.</DialogDescription>
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
                    <Input placeholder="Es. IVA 2° trimestre · rata 1/6" {...field} />
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
                      <Input type="number" inputMode="decimal" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scadenza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scadenza</FormLabel>
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
