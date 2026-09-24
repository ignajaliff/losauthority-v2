import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
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
import { useEliminaTag, useRinominaTag } from "../hooks/useTag";
import { tagSchema, type TagFormValues } from "../schema";
import type { TagConConteggio } from "../types";

function testoClienti(n: number): string {
  if (n === 0) return "Nessun cliente";
  return n === 1 ? "1 cliente" : `${n} clienti`;
}

/** Riga di un tag: label modificabile inline, conteggio clienti, elimina con conferma. */
export function TagRiga({ tag }: { tag: TagConConteggio }) {
  const [modifica, setModifica] = useState(false);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const rinomina = useRinominaTag();
  const elimina = useEliminaTag();

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { label: tag.label },
  });

  function apriModifica() {
    form.reset({ label: tag.label });
    setModifica(true);
  }

  function onSubmit({ label }: TagFormValues) {
    if (label === tag.label) {
      setModifica(false);
      return;
    }
    rinomina.mutate({ id: tag.id, label }, { onSuccess: () => setModifica(false) });
  }

  return (
    <li className="flex items-center gap-2 py-2.5">
      {modifica ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 items-start gap-2"
            noValidate
            onKeyDown={(e) => {
              if (e.key === "Escape") setModifica(false);
            }}
          >
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Nome del tag</FormLabel>
                  <FormControl>
                    <Input autoFocus maxLength={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" aria-label="Salva" disabled={rinomina.isPending}>
              <Check aria-hidden />
            </Button>
            <Button type="button" size="icon" variant="ghost" aria-label="Annulla" onClick={() => setModifica(false)}>
              <X aria-hidden />
            </Button>
          </form>
        </Form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{tag.label}</p>
            <p className="text-xs text-muted-foreground">{testoClienti(tag.clienti)}</p>
          </div>
          <Button size="icon" variant="ghost" aria-label={`Rinomina il tag ${tag.label}`} onClick={apriModifica}>
            <Pencil aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Elimina il tag ${tag.label}`}
            onClick={() => setConfermaElimina(true)}
          >
            <Trash2 aria-hidden />
          </Button>
        </>
      )}

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il tag "{tag.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {tag.clienti > 0
                ? `Verrà rimosso da ${testoClienti(tag.clienti).toLowerCase()} che lo ${tag.clienti === 1 ? "ha" : "hanno"}. L'operazione non si può annullare.`
                : "Nessun cliente lo sta usando. L'operazione non si può annullare."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elimina.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => elimina.mutate(tag.id, { onSuccess: () => setConfermaElimina(false) })}
            >
              {elimina.isPending ? "Elimino…" : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
