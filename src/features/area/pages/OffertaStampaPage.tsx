import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { codiceOfferta, ETICHETTA_POSIZIONAMENTO, StrutturaOfferta, useOfferta, useOfferte } from "@/features/offerta";
import { MarmoLogo } from "@/shared/components/brand/MarmoLogo";
import { Button } from "@/shared/components/ui/button";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDate } from "@/shared/utils/formatDate";
import "@/features/offerta/stampa.css";

/**
 * /stampa/offerta/:id → la scheda dell'offerta come documento, fuori dalle shell
 * (niente sidebar né header): appena i dati arrivano si apre la finestra di
 * stampa del browser, da cui si sceglie "Salva come PDF". Il titolo della pagina
 * diventa il nome del file. La leggono il cliente (la propria) e il team.
 */
export default function OffertaStampaPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { utente } = useAuth();
  const offerta = useOfferta(id);
  const tutte = useOfferte(offerta.data?.cliente_id);
  const stampata = useRef(false);
  const o = offerta.data;

  // Il nome del file PDF = titolo del documento; si ripristina all'uscita.
  useEffect(() => {
    if (!o) return;
    const prima = document.title;
    document.title = `Offerta - ${o.nome ?? "in costruzione"}`;
    return () => {
      document.title = prima;
    };
  }, [o]);

  // Stampa automatica una sola volta, con un attimo di respiro per i font.
  useEffect(() => {
    if (!o || stampata.current) return;
    stampata.current = true;
    const timer = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(timer);
  }, [o]);

  if (offerta.isLoading) return <SkeletonBlocco altezza="h-96" />;
  if (offerta.isError) return <ErroreCaricamento />;
  if (!o) return <StatoVuoto titolo="Offerta non trovata" testo="Forse è stata eliminata." />;

  const numero = Math.max((tutte.data?.findIndex((x) => x.id === o.id) ?? -1) + 1, 1);
  const posizionamento = o.posizionamento ? ETICHETTA_POSIZIONAMENTO[o.posizionamento] : null;
  const titolare = utente?.rol === "cliente" ? utente.nombre : null;

  // Sotto sm (solo telefono: la pagina di stampa è più larga) margini e titolo più stretti; grid-cols-1 tiene tutto dentro lo schermo.
  return (
    <main className="offerta-stampa mx-auto grid max-w-[820px] grid-cols-1 gap-6 px-4 py-6 text-foreground sm:px-5 sm:py-8">
      <div className="no-stampa flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Nella finestra di stampa scegli "Salva come PDF".</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer aria-hidden /> Stampa / Salva PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.close()}>
            <X aria-hidden /> Chiudi
          </Button>
        </div>
      </div>

      <article className="grid min-w-0 gap-8 rounded-lg border bg-card p-5 shadow-sm sm:p-8">
        <header className="grid gap-5 border-b pb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <MarmoLogo />
            <p className="figure text-[11px] text-muted-foreground">
              Offerta · N. {codiceOfferta(numero)} · {formatDate(o.updated_at)}
            </p>
          </div>
          <div className="grid gap-2">
            <p className="eyebrow">{o.stato === "completo" ? "Offerta completa" : "Offerta in costruzione"}</p>
            <h1 className="text-[32px] leading-[1.05] break-words sm:text-[40px]">{o.nome ?? "Offerta in costruzione"}</h1>
            {o.trasformazione ? <p className="font-display text-[22px] leading-snug italic text-foreground/85">«{o.trasformazione}»</p> : null}
          </div>
          <dl className="grid gap-4 sm:grid-cols-4">
            <Dato etichetta="Per chi" valore={o.per_chi} />
            <Dato etichetta="Prezzo" valore={o.prezzo} />
            <Dato etichetta="Posizionamento" valore={posizionamento} />
            <Dato etichetta="Cos'è" valore={o.tipo} />
            {titolare ? <Dato etichetta="Titolare" valore={titolare} /> : null}
            {o.frase_presentazione ? <Dato etichetta="Come ti presenti" valore={o.frase_presentazione} className="sm:col-span-3" /> : null}
          </dl>
          {o.snapshot ? (
            <section className="grid gap-1.5">
              <h2 className="eyebrow font-sans text-[10px]">In ascensore</h2>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{o.snapshot}</p>
            </section>
          ) : null}
        </header>

        <StrutturaOfferta offerta={o} larga />

        <footer className="border-t pt-4 text-[11px] text-muted-foreground">
          Costruita con Aura · Upscale, il percorso di Wesley Caicedo. Le voci in "Da confermare" sono proposte ancora da validare in call.
        </footer>
      </article>
    </main>
  );
}

function Dato({ etichetta, valore, className }: { etichetta: string; valore: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      <dt className="eyebrow text-[10px]">{etichetta}</dt>
      <dd className="mt-0.5 text-[15px] leading-snug">{valore ?? "—"}</dd>
    </div>
  );
}
