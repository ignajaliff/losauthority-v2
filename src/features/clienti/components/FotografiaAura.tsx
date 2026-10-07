import { ETICHETTE_VALORI } from "@onboarding/valori.ts";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { formatDateShort } from "@/shared/utils/formatDate";
import { useLetturaOnboarding, type SchedaOnboardingCliente } from "../hooks/useSchedaOnboarding";

type ChiaveValore = keyof typeof ETICHETTE_VALORI;
const VALORI: ChiaveValore[] = ["nodo_centrale", "fase_economica", "collo_bottiglia", "chiarezza_offerta", "urgenza", "gruppo_ia"];

function etichetta(chiave: ChiaveValore, v: string | null): string | null {
  if (!v) return null;
  return (ETICHETTE_VALORI[chiave] as Record<string, string>)[v] ?? v;
}

interface OpinioneVsFatto {
  il_cliente_pensa?: string;
  i_dati_dicono?: string;
  campi?: string[];
}

interface DomandaChiarimento {
  domanda?: string;
  campo?: string;
  perche_serve?: string;
}

function Lista({ titolo, voci }: { titolo: string; voci: string[] }) {
  if (voci.length === 0) return null;
  return (
    <div>
      <h4 className="eyebrow mb-1.5">{titolo}</h4>
      <ul className="grid gap-1 text-sm leading-relaxed">
        {voci.map((v, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Testo({ titolo, testo }: { titolo: string; testo: string | null }) {
  if (!testo) return null;
  return (
    <div>
      <h4 className="eyebrow mb-1.5">{titolo}</h4>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{testo}</p>
    </div>
  );
}

/**
 * La fotografia che Aura ha scritto per Wesley a fine onboarding (compito 2):
 * valori fissi, snapshot, opinioni vs fatti, forza/criticità, nodo centrale,
 * priorità, da validare in call, note per gli agenti, chiarimenti e riepilogo.
 * Il cliente non la vede (RLS su onboarding_lettura).
 */
export function FotografiaAura({ clienteId, scheda }: { clienteId: string; scheda: SchedaOnboardingCliente | null }) {
  const { data, isLoading, isError } = useLetturaOnboarding(clienteId);
  if (isLoading) return <SkeletonBlocco />;
  if (isError || !data) return <ErroreCaricamento />;
  const l = data.lettura;

  const ovf = Array.isArray(l?.opinioni_vs_fatti) ? (l?.opinioni_vs_fatti as OpinioneVsFatto[]) : [];
  const perche = Array.isArray(l?.domande_chiarimento) ? (l?.domande_chiarimento as DomandaChiarimento[]) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Fotografia di Aura
          <Badge variant={l ? "active" : "outline"}>{l ? `Giro ${l.giro}` : "Nessuna"}</Badge>
        </CardTitle>
        <CardDescription>
          La lettura dell'onboarding per te: fatti contro opinioni, il nodo centrale e cosa validare in call. Il cliente non la vede.
          {l ? ` Scritta il ${formatDateShort(l.updated_at)}.` : ""}
        </CardDescription>
      </CardHeader>
      {l ? (
        <CardContent className="grid gap-5">
          <div className="flex flex-wrap gap-1.5">
            {VALORI.map((k) => {
              const e = etichetta(k, l[k]);
              return e ? (
                <Badge key={k} variant={k === "nodo_centrale" ? "default" : "outline"}>
                  {e}
                </Badge>
              ) : null;
            })}
          </div>
          <Testo titolo="Snapshot" testo={l.snapshot} />
          {ovf.length > 0 ? (
            <div>
              <h4 className="eyebrow mb-1.5">Il cliente pensa · i dati dicono</h4>
              <ul className="grid gap-2 text-sm leading-relaxed">
                {ovf.map((o, i) => (
                  <li key={i} className="rounded-md border px-3 py-2">
                    <p>
                      <span className="text-muted-foreground">Pensa:</span> {o.il_cliente_pensa ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">I dati dicono:</span> {o.i_dati_dicono ?? "—"}
                    </p>
                    {o.campi && o.campi.length > 0 ? <p className="mt-1 font-mono text-[11px] text-muted-foreground">{o.campi.join(" · ")}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <Lista titolo="Punti di forza" voci={l.punti_di_forza} />
            <Lista titolo="Criticità" voci={l.criticita} />
          </div>
          <Testo titolo="Perché questo nodo centrale" testo={l.perche_nodo_centrale} />
          <Testo titolo="Priorità operativa" testo={l.priorita_operativa} />
          <Lista titolo="Da validare in call" voci={l.da_validare_in_call} />
          {data.chiarimenti.length > 0 ? (
            <div>
              <h4 className="eyebrow mb-1.5">Chiarimenti chiesti al cliente</h4>
              <ul className="grid gap-2 text-sm leading-relaxed">
                {data.chiarimenti.map((c) => (
                  <li key={c.id} className="rounded-md border px-3 py-2">
                    <p className="font-medium">{c.domanda}</p>
                    <p className="whitespace-pre-wrap">{c.risposta ?? "(senza risposta)"}</p>
                    {perche[c.ordine - 1]?.perche_serve ? <p className="mt-1 text-xs text-muted-foreground">Perché: {perche[c.ordine - 1]?.perche_serve}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Testo titolo="Riepilogo mostrato al cliente" testo={scheda?.riepilogo ?? null} />
          <Testo titolo="Correzione del cliente al riepilogo" testo={scheda?.riepilogoCorrezione ?? null} />
          <details className="rounded-md border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">Note per gli agenti Avatar e Offerta</summary>
            <div className="mt-2 grid gap-3">
              <Testo titolo="Avatar" testo={l.note_avatar} />
              <Testo titolo="Offerta" testo={l.note_offerta} />
            </div>
          </details>
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">Aura la scrive quando il cliente finisce il form e conferma il riepilogo.</p>
        </CardContent>
      )}
    </Card>
  );
}
