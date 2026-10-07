import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useSalvaLead } from "../hooks/useLead";
import { leadRapidoSchema, rapidoToLead, type LeadRapidoValues } from "../schema";
import { LEAD_FONTI } from "../types";

const FONTE_ITEMS: Record<string, string> = Object.fromEntries(LEAD_FONTI.map((f) => [f, f]));
const VALORI_INIZIALI: LeadRapidoValues = { nome: "", contatto: "", fonte: "WhatsApp", note: "" };

/** Pulsante "+ Lead" della topbar: mini-popup per annotare in pochi secondi chi ti ha scritto. */
export function NuovoLeadRapido() {
  const [aperto, setAperto] = useState(false);
  const salva = useSalvaLead();
  const form = useForm<LeadRapidoValues>({ resolver: zodResolver(leadRapidoSchema), defaultValues: VALORI_INIZIALI });

  function onOpenChange(open: boolean) {
    if (salva.isPending) return;
    if (open) form.reset(VALORI_INIZIALI);
    setAperto(open);
  }

  function onSubmit(values: LeadRapidoValues) {
    salva.mutate({ dati: rapidoToLead(values) }, { onSuccess: () => setAperto(false) });
  }

  return (
    <Dialog open={aperto} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus aria-hidden /> Lead
      </DialogTrigger>
      <DialogContent showCloseButton={!salva.isPending}>
        <DialogHeader>
          <DialogTitle>Nuovo lead</DialogTitle>
          <DialogDescription>Entra nella pipeline in stage "Nuovo". Valore e prossima azione li aggiungi dopo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder="Chi ti ha scritto?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <FormField
                control={form.control}
                name="contatto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contatto</FormLabel>
                    <FormControl>
                      <Input placeholder="WhatsApp / email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fonte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte</FormLabel>
                    <Select value={field.value} items={FONTE_ITEMS} onValueChange={(v) => field.onChange(v ?? "WhatsApp")}>
                      <FormControl>
                        <SelectTrigger className="w-full" onBlur={field.onBlur}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_FONTI.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (facoltative)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Di cosa si occupa, cosa vuole…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" disabled={salva.isPending} onClick={() => setAperto(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={salva.isPending}>
                {salva.isPending ? "Salvo…" : "Aggiungi lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
