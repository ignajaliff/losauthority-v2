import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { generaCompitiSchema, type GeneraCompitiValues } from "../schema";
import { useGeneraCompiti } from "../hooks/useChiamate";
import { CALL_NUMERI, type CallNumero } from "../types";

const ETICHETTE_CALL: Record<string, string> = Object.fromEntries(
  CALL_NUMERI.map((n) => [String(n), `Call n°${n}`]),
);

/**
 * "Genera compiti con Aura": Aura legge il riassunto della call e scrive i
 * compiti sulla board Notion "Compiti per call n°X" del cliente.
 * Scrittura diretta (scelta di Wesley): i ritocchi si fanno su Notion.
 */
export function GeneraCompitiDialog({
  chiamataId,
  callSuggerita,
}: {
  chiamataId: string;
  callSuggerita: CallNumero;
}) {
  const [aperto, setAperto] = useState(false);
  const genera = useGeneraCompiti();

  const form = useForm<GeneraCompitiValues>({
    resolver: zodResolver(generaCompitiSchema),
    defaultValues: { call_n: callSuggerita },
  });

  function onOpenChange(open: boolean) {
    if (genera.isPending) return; // Aura sta scrivendo: la finestra resta aperta
    if (open) form.reset({ call_n: callSuggerita });
    setAperto(open);
  }

  function onSubmit(values: GeneraCompitiValues) {
    genera.mutate({ chiamataId, callN: values.call_n }, { onSuccess: () => setAperto(false) });
  }

  return (
    <Dialog open={aperto} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="secondary" size="sm" />}>
        <Sparkles /> Genera compiti con Aura
      </DialogTrigger>
      <DialogContent showCloseButton={!genera.isPending}>
        <DialogHeader>
          <DialogTitle>Genera compiti con Aura</DialogTitle>
          <DialogDescription>
            Aura legge il riassunto della call e scrive i compiti sulla board Notion del cliente. Scegli la
            call per cui preparare i compiti.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="call_n"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board di destinazione</FormLabel>
                  <FormControl>
                    <Select
                      items={ETICHETTE_CALL}
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={genera.isPending}
                    >
                      <SelectTrigger className="w-full" aria-label="Board di destinazione">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CALL_NUMERI.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {ETICHETTE_CALL[String(n)]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {genera.isPending && (
              <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="animate-spin" /> Aura sta scrivendo… (~1 minuto)
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={genera.isPending} onClick={() => setAperto(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={genera.isPending}>
                <Sparkles /> Genera
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
