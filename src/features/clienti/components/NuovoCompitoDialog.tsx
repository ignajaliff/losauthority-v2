import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CornerDownRight, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useAggiungiCompito } from "../hooks/useCompiti";
import { compitoSchema, type CompitoValues } from "../schema";

interface NuovoCompitoDialogProps {
  clienteId: string;
  /** Tappa a cui aggiungere un sotto-compito; assente = nuova tappa. */
  padre?: { id: string; testo: string };
}

const taglia = (t: string, n = 70) => (t.length > n ? `${t.slice(0, n)}…` : t);

/** Popup "Aggiungi tappa" / "Sotto-compito": una voce del piano d'azione scritta a mano dal team. */
export function NuovoCompitoDialog({ clienteId, padre }: NuovoCompitoDialogProps) {
  const { utente } = useAuth();
  const [aperto, setAperto] = useState(false);
  const aggiungi = useAggiungiCompito(clienteId);
  const vuoto: CompitoValues = { testo: "", link_skool: "", nota_skool: "" };
  const form = useForm<CompitoValues>({ resolver: zodResolver(compitoSchema), defaultValues: vuoto });

  function onOpenChange(open: boolean) {
    if (aggiungi.isPending) return;
    if (open) form.reset(vuoto);
    setAperto(open);
  }

  function onSubmit(values: CompitoValues) {
    if (!utente) return;
    aggiungi.mutate(
      {
        testo: values.testo,
        autoreId: utente.id,
        padreId: padre?.id ?? null,
        linkSkool: padre ? values.link_skool || null : null,
        notaSkool: padre ? values.nota_skool || null : null,
      },
      { onSuccess: () => setAperto(false) },
    );
  }

  return (
    <Dialog open={aperto} onOpenChange={onOpenChange}>
      {padre ? (
        <DialogTrigger render={<Button size="sm" variant="ghost" className="text-muted-foreground" />}>
          <CornerDownRight aria-hidden /> Sotto-compito
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          <Plus aria-hidden /> Aggiungi tappa
        </DialogTrigger>
      )}
      <DialogContent showCloseButton={!aggiungi.isPending}>
        <DialogHeader>
          <DialogTitle>{padre ? "Nuovo sotto-compito" : "Nuova tappa"}</DialogTitle>
          <DialogDescription>
            {padre
              ? `Un passo concreto della tappa «${taglia(padre.testo)}». La tappa risulterà fatta quando tutti i suoi sotto-compiti lo saranno.`
              : "Un obiettivo del percorso, in coda alla linea del tempo. Dentro potrai aggiungere i sotto-compiti che il cliente spunta."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="testo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{padre ? "Sotto-compito" : "Tappa"}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      autoFocus
                      placeholder={padre ? "Es. «Registra 3 video parlando del metodo, 60 secondi ciascuno»" : "Es. «Primi 6 video: il format base»"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {padre ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <FormField
                  control={form.control}
                  name="link_skool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lezione Skool (facoltativa)</FormLabel>
                      <FormControl>
                        <Input type="url" inputMode="url" placeholder="https://www.skool.com/loscreators/classroom/…" {...field} />
                      </FormControl>
                      <FormDescription>Il cliente vedrà «ti aiuta la lezione …» accanto al sotto-compito. Copia il link dalla pagina Lezioni.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nota_skool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota accanto al link</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Dal minuto 20:03" maxLength={120} {...field} />
                      </FormControl>
                      <FormDescription>Dove guardare, in poche parole.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={aggiungi.isPending} onClick={() => setAperto(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={aggiungi.isPending}>
                {aggiungi.isPending ? "Salvo…" : "Aggiungi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
