import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { todayIso } from "@/shared/utils/formatDate";
import { useEliminaLeadCrm, useSalvaLeadCrm } from "../hooks/useLeadCrm";
import { formToLeadCrm, leadCrmSchema, leadCrmToForm, type LeadCrmFormValues } from "../schema";
import { ETICHETTA_FONTE_LEAD, ETICHETTA_STATO_LEAD, FONTI_LEAD, STATI_LEAD, type LeadCrm } from "../types";

const FONTE_ITEMS: Record<string, string> = { "": "Scegli…", ...ETICHETTA_FONTE_LEAD };

export interface OffertaScelta {
  id: string;
  nome: string;
}

interface LeadCrmDialogProps {
  clienteId: string;
  aperto: boolean;
  /** null → nuovo contatto. */
  lead: LeadCrm | null;
  /** Le offerte del cliente (Cervello del tuo branding → Offerta). */
  offerte: OffertaScelta[];
  onChiudi: () => void;
}

/** Popup «Nuovo contatto» / «Modifica contatto». Il form vive in un figlio così si rimonta a ogni apertura. */
export function LeadCrmDialog({ clienteId, aperto, lead, offerte, onChiudi }: LeadCrmDialogProps) {
  return (
    <Dialog open={aperto} onOpenChange={(open) => (open ? null : onChiudi())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lead ? "Modifica contatto" : "Nuovo contatto"}</DialogTitle>
          {/* Riga fissa richiesta dal documento GDPR di Wesley: sempre visibile nel modulo. */}
          <DialogDescription>
            Inserisci solo i dati che ti servono per seguire il contatto. Sei tu che devi informare i tuoi contatti su come usi i loro dati.
          </DialogDescription>
        </DialogHeader>
        {/* Il contenuto si smonta alla chiusura: a ogni apertura il form riparte dai valori del contatto. */}
        <LeadCrmForm key={lead?.id ?? "nuovo"} clienteId={clienteId} lead={lead} offerte={offerte} onChiudi={onChiudi} />
      </DialogContent>
    </Dialog>
  );
}

function LeadCrmForm({ clienteId, lead, offerte, onChiudi }: Omit<LeadCrmDialogProps, "aperto">) {
  const salva = useSalvaLeadCrm(clienteId);
  const elimina = useEliminaLeadCrm(clienteId);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const form = useForm<LeadCrmFormValues>({ resolver: zodResolver(leadCrmSchema), defaultValues: leadCrmToForm(lead) });
  const occupato = salva.isPending || elimina.isPending;
  const chiuso = useWatch({ control: form.control, name: "stato" }) === "chiuso";
  const offertaItems: Record<string, string> = { "": "Nessuna", ...Object.fromEntries(offerte.map((o) => [o.id, o.nome])) };

  function onSubmit(values: LeadCrmFormValues) {
    salva.mutate({ id: lead?.id, dati: formToLeadCrm(values) }, { onSuccess: onChiudi });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Es. Giulia o «la signora del negozio»" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" inputMode="email" autoComplete="off" placeholder="giulia@esempio.it" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono</FormLabel>
                <FormControl>
                  <Input type="tel" inputMode="tel" autoComplete="off" placeholder="+39 333 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fonte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Da dove arriva *</FormLabel>
                <Select value={field.value} items={FONTE_ITEMS} onValueChange={(v) => field.onChange(v ?? "")}>
                  <FormControl>
                    <SelectTrigger className="w-full" onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FONTI_LEAD.map((f) => (
                      <SelectItem key={f} value={f}>
                        {ETICHETTA_FONTE_LEAD[f]}
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
            name="stato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stato *</FormLabel>
                <Select value={field.value} items={ETICHETTA_STATO_LEAD} onValueChange={(v) => field.onChange(v ?? "nuovo")}>
                  <FormControl>
                    <SelectTrigger className="w-full" onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATI_LEAD.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ETICHETTA_STATO_LEAD[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {chiuso ? (
          <FormField
            control={form.control}
            name="valore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valore della vendita (€)</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="Es. 1.500" className="sm:w-48" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="offerta_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Offerta che gli interessa</FormLabel>
              <Select value={field.value} items={offertaItems} onValueChange={(v) => field.onChange(v ?? "")}>
                <FormControl>
                  <SelectTrigger className="w-full" onBlur={field.onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nessuna</SelectItem>
                  {offerte.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {offerte.length === 0 ? (
                <FormDescription>
                  Non hai ancora un'offerta:{" "}
                  <Link to="/area/cervello/offerta" className="underline underline-offset-4 hover:text-foreground">
                    costruiscila con Aura
                  </Link>{" "}
                  e poi sceglila qui.
                </FormDescription>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="arrivato_il"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arrivato il</FormLabel>
              <FormControl>
                <Input type="date" max={todayIso()} className="sm:w-48" {...field} />
              </FormControl>
              <FormDescription>Se è arrivato prima di oggi, cambia la data: così il grafico dei lead è giusto.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="sm:justify-between">
          {lead ? (
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={occupato} onClick={() => setConfermaElimina(true)}>
              <Trash2 aria-hidden /> Elimina
            </Button>
          ) : (
            <span />
          )}
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="button" variant="outline" disabled={occupato} onClick={onChiudi}>
              Annulla
            </Button>
            <Button type="submit" disabled={occupato}>
              {salva.isPending ? "Salvo…" : lead ? "Salva" : "Aggiungi"}
            </Button>
          </div>
        </DialogFooter>
      </form>

      <AlertDialog open={confermaElimina} onOpenChange={setConfermaElimina}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il contatto?</AlertDialogTitle>
            <AlertDialogDescription>"{lead?.nome}" viene cancellato davvero, anche dal grafico dei lead. Non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elimina.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => {
                if (!lead) return;
                elimina.mutate(lead.id, {
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
