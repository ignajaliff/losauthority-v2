import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAggiornaStile, useEliminaStile } from "../hooks/useStili";
import { modificaStileSchema, type ModificaStileFormValues } from "../schema";
import { linkCreaIdee, type Stile } from "../types";

interface StileSheetProps {
  clienteId: string;
  stile: Stile | null;
  onChiudi: () => void;
}

/** Pannello di uno stile: le istruzioni scritte da Aura (ritoccabili), gli script di partenza, elimina, usa in Crea idee. */
export function StileSheet({ clienteId, stile, onChiudi }: StileSheetProps) {
  return (
    <Sheet open={stile !== null} onOpenChange={(open) => !open && onChiudi()}>
      <SheetContent className="w-full gap-0 overflow-x-hidden overflow-y-auto sm:max-w-[720px]">
        {stile ? <DettaglioStile key={stile.id} clienteId={clienteId} stile={stile} onChiudi={onChiudi} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function DettaglioStile({ clienteId, stile, onChiudi }: { clienteId: string; stile: Stile; onChiudi: () => void }) {
  const aggiorna = useAggiornaStile(clienteId);
  const elimina = useEliminaStile(clienteId);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [scriptAperti, setScriptAperti] = useState(false);
  const form = useForm<ModificaStileFormValues>({
    resolver: zodResolver(modificaStileSchema),
    defaultValues: { titolo: stile.titolo, istruzioni: stile.istruzioni },
  });
  const occupato = aggiorna.isPending || elimina.isPending;
  const modificato = form.formState.isDirty;

  function onSubmit(values: ModificaStileFormValues) {
    aggiorna.mutate({ id: stile.id, dati: values }, { onSuccess: () => form.reset(values) });
  }

  return (
    <>
      <SheetHeader className="border-b px-4 py-[18px] pr-12 sm:px-6">
        <SheetTitle className="font-display text-xl font-medium">{stile.titolo}</SheetTitle>
        <SheetDescription>{stile.descrizione ?? "Come si costruisce un video in questo stile nel tuo nicho, secondo Aura."}</SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 gap-5 p-4 *:min-w-0 sm:p-6" noValidate>
          <FormField
            control={form.control}
            name="titolo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="istruzioni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Come si fa questo stile</FormLabel>
                <FormControl>
                  <Textarea rows={22} className="field-sizing-fixed text-base leading-relaxed wrap-anywhere md:text-[13.5px]" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">Sono le istruzioni che Aura segue quando lo richiami con «/». Puoi correggerle con parole tue.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          {stile.script_fonte.length > 0 ? (
            <div className="grid gap-2 rounded-lg border bg-muted/30 p-4">
              <button
                type="button"
                onClick={() => setScriptAperti((v) => !v)}
                className="flex w-full items-center justify-between text-left text-sm font-medium"
                aria-expanded={scriptAperti}
              >
                Script di partenza ({stile.script_fonte.length})
                <ChevronDown className={cn("size-4 transition-transform", scriptAperti && "rotate-180")} aria-hidden />
              </button>
              {scriptAperti ? (
                <ol className="grid gap-3 pt-1">
                  {stile.script_fonte.map((s, i) => (
                    <li key={i} className="grid gap-1">
                      <p className="eyebrow text-[10px]">Script {i + 1}</p>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{s}</p>
                    </li>
                  ))}
                </ol>
              ) : null}
              {stile.note ? <p className="pt-1 text-xs text-muted-foreground">Cosa ti piaceva: {stile.note}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={occupato} onClick={() => setConfermaElimina(true)}>
              <Trash2 aria-hidden /> Elimina
            </Button>
            <div className="flex flex-wrap gap-2">
              {modificato ? (
                <Button type="submit" variant="outline" disabled={occupato}>
                  {aggiorna.isPending ? "Salvo…" : "Salva modifiche"}
                </Button>
              ) : null}
              <Button nativeButton={false} disabled={occupato} render={<Link to={linkCreaIdee(stile.id)} />}>
                Usa in Crea idee <ArrowRight aria-hidden />
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare lo stile?</AlertDialogTitle>
            <AlertDialogDescription>«{stile.titolo}» sparisce dal menu «/» di Crea idee. Le conversazioni già fatte restano.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elimina.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() =>
                elimina.mutate(stile.id, {
                  onSuccess: () => {
                    setConfermaElimina(false);
                    onChiudi();
                  },
                })
              }
            >
              {elimina.isPending ? "Elimino…" : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
