import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, CalendarClock, Plus, Search, Sparkles, X } from "lucide-react";
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
import { Input } from "@/shared/components/ui/input";
import { useAvviaRicerca, useProponiKeyword, type KeywordProposta } from "../hooks/useRicerche";
import { keywordPiene, keywordSchema, lingueDa, temaSchema, type KeywordFormValues, type TemaFormValues } from "../schema";
import { conArticolo, elencoLingue, GIORNI_TRA_RICERCHE, LINGUE_AUTOMATICHE, MAX_KEYWORD, nomeLingua } from "../types";

/** Giorno e ora esatti: la ricerca si sblocca 15 giorni dopo l'ultima, al minuto. */
const quando = (d: Date) => format(d, "d MMMM 'alle' HH:mm", { locale: it });
const LINGUE = elencoLingue(LINGUE_AUTOMATICHE);

/** Una casella per lingua, nell'ordine delle top; quella che Aura non ha proposto resta vuota (si salta). */
const righePerLingua = (proposte: KeywordProposta[]) => {
  const perLingua = LINGUE_AUTOMATICHE.map((lingua) => ({ lingua, testo: proposte.find((p) => p.lingua === lingua)?.testo ?? "" }));
  // Risposta senza lingue (funzione vecchia): le keyword in ordine, senza etichetta.
  return proposte.some((p) => p.lingua) ? perLingua : proposte.map((p) => ({ testo: p.testo }));
};

/** La sigla della lingua accanto alla casella (o «+» per una keyword in più). */
function SiglaLingua({ lingua }: { lingua?: string }) {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border bg-muted text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
      title={lingua ? `Keyword in ${nomeLingua(lingua)}` : "Keyword in più"}
      aria-hidden
    >
      {lingua ?? "+"}
    </span>
  );
}

interface NuovaRicercaProps {
  clienteId: string;
  /** Prossima ricerca possibile (null = adesso). */
  prossima: Date | null;
  onAvviata: (id: string) => void;
  /** Avvio non riuscito: la pagina tiene montato il form (con le keyword) anche se l'elenco cambia. */
  onFallita?: () => void;
}

/**
 * Passo 1 il tema → Aura propone una keyword per lingua (italiano, inglese, spagnolo) partendo da chi è
 * il cliente → passo 2 il cliente le corregge e avvia (una ricerca ogni 15 giorni).
 */
export function NuovaRicerca({ clienteId, prossima, onAvviata, onFallita }: NuovaRicercaProps) {
  const proponi = useProponiKeyword();
  // onFallita va all'hook (gira prima di ricaricare l'elenco), non alla callback di mutate.
  const avvia = useAvviaRicerca(clienteId, onFallita);
  const [passo, setPasso] = useState<1 | 2>(1);
  const [conferma, setConferma] = useState(false);
  const temaForm = useForm<TemaFormValues>({ resolver: zodResolver(temaSchema), defaultValues: { tema: "" } });
  const kwForm = useForm<KeywordFormValues>({ resolver: zodResolver(keywordSchema), defaultValues: { keyword: [] } });
  const { fields, append, remove, replace } = useFieldArray({ control: kwForm.control, name: "keyword" });
  // Errore sull'elenco intero (nessuna keyword o troppe), non su una casella.
  const erroreLista = kwForm.formState.errors.keyword?.root?.message ?? kwForm.formState.errors.keyword?.message;

  if (prossima) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-5">
          <CalendarClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="grid gap-1">
            <p className="font-medium">La prossima ricerca è disponibile {conArticolo("dal", quando(prossima))}</p>
            <p className="text-sm text-muted-foreground">Puoi fare una ricerca ogni {GIORNI_TRA_RICERCHE} giorni. Intanto usa i risultati che hai già.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function proponiKeyword(v: TemaFormValues) {
    proponi.mutate(
      { tema: v.tema },
      {
        onSuccess: (proposte) => {
          replace(righePerLingua(proposte));
          // Gli errori delle keyword di prima non restano sotto quelle nuove.
          kwForm.clearErrors("keyword");
          setPasso(2);
        },
      },
    );
  }
  function scrivoIo() {
    void temaForm.trigger().then((valido) => {
      if (!valido) return;
      // Il tema nella casella italiana; inglese e spagnolo vuote: si riempiono o si lasciano (si saltano).
      if (fields.length === 0) replace(LINGUE_AUTOMATICHE.map((lingua, i) => ({ lingua, testo: i === 0 ? temaForm.getValues("tema") : "" })));
      setPasso(2);
    });
  }
  function lancia() {
    const t = temaForm.getValues();
    avvia.mutate(
      { tema: t.tema, keyword: keywordPiene(kwForm.getValues("keyword")), lingue: lingueDa(kwForm.getValues("keyword")) },
      { onSuccess: (id) => { setConferma(false); onAvviata(id); }, onError: () => setConferma(false) },
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="eyebrow">Nuova ricerca · passo {passo} di 2</p>
        <CardTitle className="mt-1">{passo === 1 ? "Su quale tema cerchiamo?" : "Le keyword da cercare su TikTok"}</CardTitle>
        <CardDescription>
          {passo === 1
            ? `Scrivi il tema come lo racconteresti. Cerchiamo in ${LINGUE}: Aura lo trasforma nelle parole che le persone scrivono nella barra di ricerca di TikTok, pensando a quello che fai e ai tuoi clienti ideali.`
            : `Una per lingua, scritte come le cercheresti tu, senza #. Correggile, lasciane vuota una per saltare quella lingua o aggiungine una (massimo ${MAX_KEYWORD}). Avrai i video con più like degli ultimi 6 mesi, con una classifica per ogni lingua.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {passo === 1 ? (
          <Form {...temaForm}>
            <form onSubmit={temaForm.handleSubmit(proponiKeyword)} className="grid gap-4" noValidate>
              <FormField
                control={temaForm.control}
                name="tema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tema *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. perdere peso dopo i 40 anni" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={proponi.isPending}>
                  <Sparkles aria-hidden /> {proponi.isPending ? "Aura sceglie le parole…" : "Proponi le keyword"}
                </Button>
                <Button type="button" variant="ghost" disabled={proponi.isPending} onClick={scrivoIo}>
                  Le scrivo io
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...kwForm}>
            <form onSubmit={kwForm.handleSubmit(() => setConferma(true))} className="grid gap-4" noValidate>
              <ul className="grid gap-2">
                {fields.map((f, i) => (
                  <li key={f.id}>
                    <FormField
                      control={kwForm.control}
                      name={`keyword.${i}.testo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">{f.lingua ? `Keyword in ${nomeLingua(f.lingua)}` : `Keyword ${i + 1}`}</FormLabel>
                          <div className="flex items-start gap-2">
                            <SiglaLingua lingua={f.lingua} />
                            <FormControl>
                              <Input placeholder={f.lingua ? `In ${nomeLingua(f.lingua)} (vuota = la salti)` : "Un'altra keyword"} {...field} />
                            </FormControl>
                            <Button type="button" size="icon" variant="ghost" aria-label={`Togli la keyword ${i + 1}`} onClick={() => remove(i)}>
                              <X aria-hidden />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </li>
                ))}
              </ul>
              {erroreLista ? <p className="text-sm text-destructive">{erroreLista}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => setPasso(1)}>
                    <ArrowLeft aria-hidden /> Cambia tema
                  </Button>
                  <Button type="button" variant="outline" disabled={fields.length >= MAX_KEYWORD} onClick={() => append({ testo: "" })}>
                    <Plus aria-hidden /> Aggiungi keyword
                  </Button>
                </div>
                <Button type="submit" className="max-sm:w-full" disabled={avvia.isPending}>
                  <Search aria-hidden /> Avvia la ricerca
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>

      <AlertDialog open={conferma} onOpenChange={setConferma}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avviare la ricerca?</AlertDialogTitle>
            <AlertDialogDescription>
              Cerchiamo in {LINGUE}, con una classifica per lingua. Puoi fare una ricerca ogni {GIORNI_TRA_RICERCHE} giorni: dopo questa, la prossima sarà
              disponibile {conArticolo("dal", quando(addDays(new Date(), GIORNI_TRA_RICERCHE)))}. Se TikTok non risponde, la ricerca non conta e puoi riprovare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={avvia.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction disabled={avvia.isPending} onClick={lancia}>
              {avvia.isPending ? "Avvio…" : "Avvia"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
