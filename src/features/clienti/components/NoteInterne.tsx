import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Textarea } from "@/shared/components/ui/textarea";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useAggiungiNota, useEliminaNota, useNoteCliente } from "../hooks/useNoteCliente";
import { notaSchema, type NotaValues } from "../schema";

/** Diario privato del team sul cliente: il cliente non lo vede mai. */
export function NoteInterne({ clienteId }: { clienteId: string }) {
  const { utente } = useAuth();
  const { data, isLoading, isError } = useNoteCliente(clienteId);
  const aggiungi = useAggiungiNota(clienteId);
  const elimina = useEliminaNota(clienteId);
  const [daEliminare, setDaEliminare] = useState<string | null>(null);

  const form = useForm<NotaValues>({ resolver: zodResolver(notaSchema), defaultValues: { testo: "" } });

  function onSubmit(values: NotaValues) {
    if (!utente) return;
    aggiungi.mutate({ testo: values.testo, autoreId: utente.id }, { onSuccess: () => form.reset() });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Note interne</CardTitle>
        <CardDescription>Appunti datati del team — il cliente non li vede.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2" noValidate>
            <FormField
              control={form.control}
              name="testo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Nuova nota</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Aggiungi una nota… (es. «chiamato, interessato al percorso completo»)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Button type="submit" size="sm" disabled={aggiungi.isPending}>
                <Plus aria-hidden />
                Aggiungi nota
              </Button>
            </div>
          </form>
        </Form>

        {isLoading ? <SkeletonRighe righe={3} /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {data && data.length > 0 ? (
          <ul className="divide-y border-t">
            {data.map((n) => (
              <li key={n.id} className="flex justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    {formatDateTime(n.created_at)}
                    {n.autore ? ` · ${n.autore.nombre}` : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{n.testo}</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Elimina nota" onClick={() => setDaEliminare(n.id)}>
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>

      <AlertDialog open={daEliminare !== null} onOpenChange={(open) => !open && setDaEliminare(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la nota?</AlertDialogTitle>
            <AlertDialogDescription>L'operazione non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => {
                if (daEliminare) elimina.mutate(daEliminare, { onSettled: () => setDaEliminare(null) });
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
