import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useEliminaLead, useSalvaLead } from "../hooks/useLead";
import { formToLead, leadSchema, leadToForm, type LeadFormValues } from "../schema";
import { LEAD_FONTI, LEAD_STAGES, type Lead } from "../types";

const FONTE_ITEMS: Record<string, string> = { "": "—", ...Object.fromEntries(LEAD_FONTI.map((f) => [f, f])) };
const STAGE_ITEMS: Record<string, string> = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, s.label]));

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null → nuovo lead. */
  lead: Lead | null;
}

/** Dialog di creazione/modifica lead. Il form vive in un figlio così si rimonta a ogni apertura. */
export function LeadDialog({ open, onOpenChange, lead }: LeadDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-[440px]">
        <SheetHeader className="border-b px-6 py-[18px]">
          <SheetTitle className="font-display text-xl font-medium">{lead ? "Modifica lead" : "Nuovo lead"}</SheetTitle>
          <SheetDescription>
            {lead ? "Aggiorna i dati e la prossima azione." : "Aggiungi un contatto alla pipeline."}
          </SheetDescription>
        </SheetHeader>
        <LeadForm key={lead?.id ?? "nuovo"} lead={lead} onChiudi={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function LeadForm({ lead, onChiudi }: { lead: Lead | null; onChiudi: () => void }) {
  const salva = useSalvaLead();
  const elimina = useEliminaLead();
  const [confermaElimina, setConfermaElimina] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: leadToForm(lead),
  });

  function onSubmit(values: LeadFormValues) {
    salva.mutate({ id: lead?.id, dati: formToLead(values) }, { onSuccess: onChiudi });
  }

  function handleElimina() {
    if (!lead) return;
    elimina.mutate(lead.id, {
      onSuccess: () => {
        setConfermaElimina(false);
        onChiudi();
      },
    });
  }

  const occupato = salva.isPending || elimina.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 p-6" noValidate>
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Es. Marco Bianchi" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contatto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contatto</FormLabel>
              <FormControl>
                <Input placeholder="Email o WhatsApp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select value={field.value} items={STAGE_ITEMS} onValueChange={(v) => field.onChange(v ?? "nuovo")}>
                  <FormControl>
                    <SelectTrigger className="w-full" onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={field.value} items={FONTE_ITEMS} onValueChange={(v) => field.onChange(v ?? "")}>
                  <FormControl>
                    <SelectTrigger className="w-full" onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
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
          name="valore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valore potenziale (€)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <FormField
            control={form.control}
            name="prossima_azione"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prossima azione</FormLabel>
                <FormControl>
                  <Input placeholder="Es. Mandare proposta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prossima_azione_il"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entro il</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="Contesto, esigenze, dettagli call…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SheetFooter className="flex-row items-center justify-between p-0 pt-2">
          {lead ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={occupato}
              onClick={() => setConfermaElimina(true)}
            >
              <Trash2 aria-hidden />
              Elimina
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onChiudi} disabled={occupato}>
              Annulla
            </Button>
            <Button type="submit" disabled={occupato}>
              {salva.isPending ? "Salvo…" : "Salva"}
            </Button>
          </div>
        </SheetFooter>
      </form>

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il lead?</AlertDialogTitle>
            <AlertDialogDescription>
              "{lead?.nome}" verrà rimosso dalla pipeline. L'operazione non si può annullare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elimina.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleElimina} disabled={elimina.isPending}>
              {elimina.isPending ? "Elimino…" : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
