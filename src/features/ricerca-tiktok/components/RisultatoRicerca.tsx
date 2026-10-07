import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "react-router-dom";
import { AlertCircle, Lightbulb, Sparkles } from "lucide-react";
import { PensieroAura } from "@/features/idee";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { messaggioErrore } from "@/shared/utils/invocaEdge";
import { usePortaVideoNelWorkflow, useUrlNelWorkflow } from "../hooks/useWorkflowRicerca";
import { conArticolo, eInCorso, elencoLingue, linkCreaIdeeConRicerca, nomeLingua, type RicercaConVideo, type VideoRicerca } from "../types";
import { TabellaVideoTiktok } from "./TabellaVideoTiktok";

/** Frasi mentre Apify cerca e la funzione elabora (i passi veri della ricerca). */
const FASI_RICERCA = [
  "Cerco su TikTok con le tue keyword…",
  "Raccolgo i video e i loro numeri…",
  "Tengo solo quelli degli ultimi 6 mesi…",
  "Li ordino per like e tolgo i doppioni…",
  "Leggo le didascalie per dirti di cosa parlano…",
  "Ci vuole qualche minuto: puoi anche tornare più tardi.",
] as const;

const data = (iso: string | null) => (iso ? format(new Date(iso), "d MMM yyyy", { locale: it }) : "—");

interface RisultatoRicercaProps {
  clienteId: string;
  ricerca: RicercaConVideo;
  /** Il polling vive nella pagina (useControllaRicerca): qui arriva solo il suo esito. */
  lenta?: boolean;
  /** Il polling si è fermato per errori: cosa è andato storto (null/undefined = tutto bene). */
  erroreControllo?: unknown;
  onRiprovaControllo?: () => void;
}

/** Una tabella dei risultati: titolo, frase sotto e i video (vuota = la frase `vuota` al posto della tabella). */
interface SezioneVideo {
  chiave: string;
  titolo: string;
  descrizione: string;
  video: VideoRicerca[];
  /** Si mostra anche senza video (una top per lingua vuota lo dice). */
  vuota?: string;
  /** La colonna lingua serve solo se nella tabella ce n'è più d'una. */
  conLingua: boolean;
}

const NOTA_ROSSE = "Le righe rosse sono «da non replicare»: restano perché i dati sono dati.";

/**
 * Le tabelle della ricerca. Dal 07/10/2026 una top per lingua (italiano, inglese, spagnolo); le
 * ricerche fatte prima hanno una top unica mista e il blocco «I migliori in [lingua target]».
 */
function sezioniDi(r: RicercaConVideo): SezioneVideo[] {
  const di = (sezione: string) => r.video.filter((v) => v.sezione === sezione);
  const conRosse = (frase: string, video: VideoRicerca[]) => (video.some((v) => v.da_non_replicare) ? `${frase} ${NOTA_ROSSE}` : frase);
  const fuori = di("fuori_soglia");
  const fuoriSoglia: SezioneVideo = {
    chiave: "fuori_soglia",
    titolo: "Rimasti fuori per pochi giorni",
    descrizione: "Pubblicati meno di 15 giorni prima della soglia dei 6 mesi: decidi tu se tenerli in conto.",
    video: fuori,
    conLingua: true,
  };

  if (r.video.some((v) => v.sezione === "top" || v.sezione === "lingua_target")) {
    const top = di("top");
    const lingua = di("lingua_target");
    const nome = nomeLingua(r.lingua_target);
    return [
      { chiave: "top", titolo: "I video con più like", descrizione: conRosse(`${top.length} video degli ultimi 6 mesi, ordinati per like; le views sono di appoggio.`, top), video: top, conLingua: true },
      { chiave: "lingua_target", titolo: `I migliori in ${nome}`, descrizione: `Nella top non c'era nessun video in ${nome}: questi sono i primi in ${nome}.`, video: lingua, conLingua: false },
      fuoriSoglia,
    ].filter((sezione) => sezione.video.length > 0);
  }

  const perLingua = di("top_lingua");
  return [
    ...r.lingue.map((l) => {
      const video = perLingua.filter((v) => v.lingua === l);
      const nome = nomeLingua(l);
      return {
        chiave: `top_${l}`,
        titolo: `Top in ${nome}`,
        descrizione: conRosse(`${video.length} video in ${nome} degli ultimi 6 mesi, ordinati per like; le views sono di appoggio.`, video),
        video,
        vuota: `Nessun video in ${nome} degli ultimi 6 mesi con queste keyword.`,
        conLingua: false,
      };
    }),
    ...(fuori.length > 0 ? [fuoriSoglia] : []),
  ];
}

function Sezione({ titolo, descrizione, children }: { titolo: string; descrizione?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-lg font-medium">{titolo}</h3>
        {descrizione ? <p className="text-sm text-muted-foreground">{descrizione}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Una ricerca: in corso (Aura che lavora), in errore, oppure il formato fisso del documento di Wesley. */
export function RisultatoRicerca({ clienteId, ricerca: r, lenta = false, erroreControllo, onRiprovaControllo }: RisultatoRicercaProps) {
  const urls = r.video.map((v) => v.url);
  const nelWorkflow = useUrlNelWorkflow(clienteId, r.id, urls);
  const porta = usePortaVideoNelWorkflow(clienteId, { id: r.id, tema: r.tema });

  if (eInCorso(r)) {
    return (
      <Card>
        <CardContent className="grid gap-4 py-8">
          <p className="text-sm text-muted-foreground">
            «{r.tema}» · {r.keyword.join(", ")}
          </p>
          {erroreControllo ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertTitle>Non riesco a sapere a che punto è la ricerca</AlertTitle>
              <AlertDescription className="grid gap-2">
                <span>{messaggioErrore(erroreControllo)}</span>
                {onRiprovaControllo ? (
                  <Button size="sm" variant="outline" className="w-fit" onClick={onRiprovaControllo}>
                    Riprova
                  </Button>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : (
            <PensieroAura fasi={FASI_RICERCA} />
          )}
          {lenta && !erroreControllo ? <p className="text-sm text-muted-foreground">Ci sta mettendo più del solito. Puoi chiudere: la ritrovi qui quando è pronta.</p> : null}
        </CardContent>
      </Card>
    );
  }

  if (r.stato === "errore") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden />
        <AlertTitle>La ricerca «{r.tema}» non è andata a buon fine</AlertTitle>
        <AlertDescription>{r.errore ?? "Riprova: questa ricerca non conta nei 15 giorni."}</AlertDescription>
      </Alert>
    );
  }

  const sezioni = sezioniDi(r);
  const conTop = r.video.some((v) => v.sezione !== "fuori_soglia");

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Ricerca {conArticolo("del", data(r.created_at))}</p>
            <CardTitle className="mt-1 font-display text-2xl font-medium">{r.tema}</CardTitle>
            {/* Riga d'apertura del documento: soglia, metodo, raccolti, recenti. */}
            <p className="mt-2 text-sm text-muted-foreground">
              Video {conArticolo("dal", data(r.soglia_dal))} · ricerca per keyword in {elencoLingue(r.lingue)} ({r.keyword.join(", ")}) · {r.raccolti ?? 0} raccolti, {r.recenti ?? 0} degli
              ultimi 6 mesi.
            </p>
          </div>
          {conTop ? (
            <Button nativeButton={false} render={<Link to={linkCreaIdeeConRicerca(r.id)} />}>
              <Sparkles aria-hidden /> Usa in Crea idee
            </Button>
          ) : null}
        </CardHeader>
        {r.avviso ? (
          <CardContent>
            <Alert>
              <AlertCircle aria-hidden />
              <AlertDescription>{r.avviso}</AlertDescription>
            </Alert>
          </CardContent>
        ) : null}
      </Card>

      {sezioni.map((sezione) => (
        <Sezione key={sezione.chiave} titolo={sezione.titolo} descrizione={sezione.video.length > 0 ? sezione.descrizione : undefined}>
          {sezione.video.length > 0 ? (
            <TabellaVideoTiktok
              video={sezione.video}
              conLingua={sezione.conLingua}
              nelWorkflow={nelWorkflow.data ?? new Set()}
              onWorkflow={(v) => porta.mutate(v)}
              occupato={porta.isPending}
            />
          ) : (
            <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">{sezione.vuota}</p>
          )}
        </Sezione>
      ))}

      {r.osservazioni.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-muted-foreground" aria-hidden /> Cosa dicono i numeri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid list-disc gap-1.5 pl-5 text-sm leading-relaxed">
              {r.osservazioni.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
