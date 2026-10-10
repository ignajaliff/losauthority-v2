import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useEliminaConcorrente, useSalvaConcorrente } from "../hooks/useConcorrenti";
import { concorrenteSchema, concorrenteToForm, formToConcorrente, type ConcorrenteFormValues } from "../schema";
import { MAX_SOCIAL, TIPI_CONCORRENTE, type Concorrente, type TipoConcorrente } from "../types";
import { CampoVideo } from "./CampoVideo";

interface ConcorrenteDialogProps {
  clienteId: string;
  aperto: boolean;
  /** null → nuova referenza. */
  concorrente: Concorrente | null;
  /** Tipo proposto per una nuova referenza (la sezione da cui si è aperto il popup). */
  tipoIniziale?: TipoConcorrente;
  onChiudi: () => void;
}

/** Popup «Nuova referenza» / «Modifica referenza». Il form vive in un figlio così si rimonta a ogni apertura. */
export function ConcorrenteDialog({ clienteId, aperto, concorrente, tipoIniziale, onChiudi }: ConcorrenteDialogProps) {
  return (
    <Dialog open={aperto} onOpenChange={(open) => (open ? null : onChiudi())}>
      <DialogContent className="sm:max-h-[90vh] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{concorrente ? "Modifica referenza" : "Nuova referenza"}</DialogTitle>
          <DialogDescription>Un competitor o un profilo che ti ispira: dove lo trovi, cosa fa e i video che vuoi tenere come esempio.</DialogDescription>
        </DialogHeader>
        <ConcorrenteForm key={concorrente?.id ?? `nuova-${tipoIniziale ?? ""}`} clienteId={clienteId} concorrente={concorrente} tipoIniziale={tipoIniziale} onChiudi={onChiudi} />
      </DialogContent>
    </Dialog>
  );
}

function ConcorrenteForm({ clienteId, concorrente, tipoIniziale, onChiudi }: Omit<ConcorrenteDialogProps, "aperto">) {
  const salva = useSalvaConcorrente(clienteId);
  const elimina = useEliminaConcorrente(clienteId);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const form = useForm<ConcorrenteFormValues>({ resolver: zodResolver(concorrenteSchema), defaultValues: concorrenteToForm(concorrente, tipoIniziale) });
  const occupato = salva.isPending || elimina.isPending;

  function onSubmit(values: ConcorrenteFormValues) {
    salva.mutate(formToConcorrente(concorrente?.id ?? null, values), { onSuccess: onChiudi });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5" noValidate>
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <div role="radiogroup" aria-label="Tipo di referenza" className="grid gap-2 sm:grid-cols-2">
                {TIPI_CONCORRENTE.map((t) => {
                  const scelto = field.value === t.valore;
                  return (
                    <button
                      key={t.valore}
                      type="button"
                      role="radio"
                      aria-checked={scelto}
                      disabled={occupato}
                      onClick={() => field.onChange(t.valore)}
                      className={`grid gap-0.5 rounded-md border p-3 text-left transition-colors ${scelto ? "border-foreground bg-muted/60" : "hover:bg-muted/40"}`}
                    >
                      <span className="text-sm font-medium">{t.etichetta}</span>
                      <span className="text-xs text-muted-foreground">{t.testo}</span>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Es. Marco Rossi o «Studio Bellezza Milano»" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Social (massimo {MAX_SOCIAL})</legend>
          {Array.from({ length: MAX_SOCIAL }, (_, i) => (
            <FormField
              key={i}
              control={form.control}
              name={`social.${i}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Social {i + 1}</FormLabel>
                  <FormControl>
                    <Input inputMode="url" placeholder={["instagram.com/nome", "tiktok.com/@nome", "youtube.com/@nome"][i]} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </fieldset>

        <FormField
          control={form.control}
          name="cosa_fa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cosa fa</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Cosa vende, a chi, come comunica, cosa ti piace o non ti piace" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <CampoVideo control={form.control} />

        <DialogFooter className="sm:justify-between">
          {concorrente ? (
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={occupato} onClick={() => setConfermaElimina(true)}>
              <Trash2 aria-hidden /> Elimina
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          {/* Sul telefono Annulla e Salva affiancati a metà larghezza, sopra «Elimina». */}
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="button" variant="outline" disabled={occupato} onClick={onChiudi}>
              Annulla
            </Button>
            <Button type="submit" disabled={occupato}>
              {salva.isPending ? "Salvo…" : concorrente ? "Salva" : "Aggiungi"}
            </Button>
          </div>
        </DialogFooter>
      </form>

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la referenza?</AlertDialogTitle>
            <AlertDialogDescription>"{concorrente?.nome}" e i suoi video verranno rimossi. Non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elimina.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => {
                if (!concorrente) return;
                elimina.mutate(concorrente.id, {
                  onSuccess: () => {
                    setConfermaElimina(false);
                    onChiudi();
                  },
                });
              }}
            >
              {elimina.isPending ? "Elimino…" : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
