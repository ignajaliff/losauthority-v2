import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
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
import { useEliminaContenuto, useSalvaContenuto } from "../hooks/useContenuti";
import { CampoRiferimenti } from "./CampoRiferimenti";
import { contenutoSchema, contenutoToForm, formToContenuto, type ContenutoFormValues } from "../schema";
import {
  ETICHETTA_STATO_CONTENUTO,
  STATO_CONTENUTO_KEYS,
  TIPOLOGIA_CONTENUTO_KEYS,
  TIPOLOGIE_CONTENUTO,
  type Contenuto,
} from "../types";

const STATO_ITEMS: Record<string, string> = { ...ETICHETTA_STATO_CONTENUTO };
const TIPOLOGIA_ITEMS: Record<string, string> = {
  "": "—",
  ...Object.fromEntries(TIPOLOGIA_CONTENUTO_KEYS.map((k) => [k, TIPOLOGIE_CONTENUTO[k].label])),
};

interface ContenutoDialogProps {
  clienteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null → nuova idea. */
  contenuto: Contenuto | null;
}

/** Pannello laterale per creare/modificare/eliminare un'idea di video. */
export function ContenutoDialog({ clienteId, open, onOpenChange, contenuto }: ContenutoDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-x-hidden overflow-y-auto sm:max-w-[720px]">
        <SheetHeader className="border-b px-6 py-[18px]">
          <SheetTitle className="font-display text-xl font-medium">{contenuto ? "Modifica contenuto" : "Nuova idea"}</SheetTitle>
          <SheetDescription>
            {contenuto ? "Aggiorna stato, date e materiali del video." : "Un'idea di video da portare fino alla pubblicazione."}
          </SheetDescription>
        </SheetHeader>
        <ContenutoForm key={contenuto?.id ?? "nuovo"} clienteId={clienteId} contenuto={contenuto} onChiudi={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

interface ContenutoFormProps {
  clienteId: string;
  contenuto: Contenuto | null;
  onChiudi: () => void;
}

function ContenutoForm({ clienteId, contenuto, onChiudi }: ContenutoFormProps) {
  const salva = useSalvaContenuto(clienteId);
  const elimina = useEliminaContenuto(clienteId);
  const [confermaElimina, setConfermaElimina] = useState(false);

  const form = useForm<ContenutoFormValues>({
    resolver: zodResolver(contenutoSchema),
    defaultValues: contenutoToForm(contenuto),
  });
  const statoScelto = form.watch("stato");

  function onSubmit(values: ContenutoFormValues) {
    salva.mutate({ id: contenuto?.id, dati: formToContenuto(values) }, { onSuccess: onChiudi });
  }

  function handleElimina() {
    if (!contenuto) return;
    elimina.mutate(contenuto.id, {
      onSuccess: () => {
        setConfermaElimina(false);
        onChiudi();
      },
    });
  }

  const occupato = salva.isPending || elimina.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 gap-4 p-6 *:min-w-0" noValidate>
        <FormField
          control={form.control}
          name="titolo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idea del video *</FormLabel>
              <FormControl>
                <Input placeholder="Es. 3 errori che fai quando pubblichi un reel" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stato</FormLabel>
                <Select value={field.value} items={STATO_ITEMS} onValueChange={(v) => field.onChange(v ?? "fase_script")}>
                  <FormControl>
                    <SelectTrigger className="w-full" onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATO_CONTENUTO_KEYS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ETICHETTA_STATO_CONTENUTO[s]}
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
            name="tipologia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipologia</FormLabel>
                <Select value={field.value} items={TIPOLOGIA_ITEMS} onValueChange={(v) => field.onChange(v ?? "")}>
                  <FormControl>
                    <SelectTrigger className="w-full" onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {TIPOLOGIA_CONTENUTO_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {TIPOLOGIE_CONTENUTO[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pubblicazione_prevista"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Da pubblicare il</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {statoScelto === "pubblicato" ? (
            <FormField
              control={form.control}
              name="pubblicato_il"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pubblicato il</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
        <FormField
          control={form.control}
          name="script"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Script</FormLabel>
              <FormControl>
                <Textarea
                  rows={10}
                  placeholder="Il testo completo del video: hook, sviluppo, chiusura…"
                  className="field-sizing-fixed font-mono text-[13px] wrap-anywhere"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <CampoRiferimenti control={form.control} />
        <FormField
          control={form.control}
          name="drive_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cartella Drive</FormLabel>
              <FormControl>
                <Input inputMode="url" placeholder="https://drive.google.com/…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Hook, struttura, riferimenti…" className="field-sizing-fixed wrap-anywhere" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SheetFooter className="flex-row items-center justify-between p-0 pt-2">
          {contenuto ? (
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
            <AlertDialogTitle>Eliminare il contenuto?</AlertDialogTitle>
            <AlertDialogDescription>"{contenuto?.titolo}" sparirà dal workflow. L'operazione non si può annullare.</AlertDialogDescription>
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
