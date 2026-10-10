import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEliminaFont, useFileFont } from "../hooks/useFileKit";
import { useFontFace } from "../hooks/useFontFace";
import { useAggiornaFont, useAggiungiFont } from "../hooks/useKitBrand";
import { type FontBrand, MAX_FONT, RUOLI_FONT, type RuoloFont } from "../types";
import { TestoInLinea } from "./TestoInLinea";

interface SpecimenFontProps {
  clienteId: string;
  font: FontBrand[];
  /** Il nome del brand: è la parola che si compone nel campione dei titoli. */
  nomeBrand: string | null;
}

const ACCETTA_FONT = ".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2";

/** Un font come in un campionario tipografico: il nome del brand composto grande, la riga di prova, il pie con nome e ruolo. */
function Campione({ font, clienteId, nomeBrand }: { font: FontBrand; clienteId: string; nomeBrand: string | null }) {
  const famiglia = useFontFace(font.id, font.storage_path);
  const aggiorna = useAggiornaFont(clienteId);
  const file = useFileFont(clienteId);
  const elimina = useEliminaFont(clienteId);
  const input = useRef<HTMLInputElement>(null);
  const ruolo = RUOLI_FONT.find((r) => r.valore === font.ruolo) ?? RUOLI_FONT[0];
  // Senza file: si mostra con la font di pagina del ruolo (serif per i titoli), così si capisce il posto che occupa.
  const stile: React.CSSProperties = famiglia ? { fontFamily: `"${famiglia}", sans-serif` } : font.ruolo === "titoli" ? { fontFamily: "var(--font-display)" } : {};
  const parola = nomeBrand?.trim() || "Aa Bb Cc";

  return (
    <li className="grid gap-4 border-t py-8 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,1fr)_240px] md:gap-10">
      <div className="min-w-0">
        <p className={cn("truncate leading-none", font.ruolo === "titoli" ? "text-[clamp(44px,8vw,112px)]" : "text-[clamp(28px,4.5vw,56px)]")} style={stile} aria-hidden>
          {parola}
        </p>
        <p className={cn("mt-4 max-w-[60ch] leading-relaxed break-words", font.ruolo === "testo" ? "text-[17px]" : "text-[15px] text-muted-foreground")} style={stile}>
          {ruolo.specimen} ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
        </p>
        {!famiglia && font.storage_path ? <p className="mt-2 text-[11px] text-muted-foreground">Carico il file del font…</p> : null}
      </div>
      <div className="grid content-start gap-2 text-[13px] md:border-l md:pl-6">
        <TestoInLinea valore={font.nome} segnaposto="Nome del font" etichetta="Nome del font" maxLength={120} className="font-medium" onSalva={(nome) => nome && aggiorna.mutate({ id: font.id, nome })} />
        <select
          value={font.ruolo}
          aria-label="Ruolo del font"
          onChange={(e) => aggiorna.mutate({ id: font.id, ruolo: e.target.value as RuoloFont })}
          className="-mx-1 h-9 w-fit rounded-sm bg-transparent px-1 text-base text-muted-foreground hover:bg-foreground/[0.04] md:h-7 md:text-[13px]"
        >
          {RUOLI_FONT.map((r) => (
            <option key={r.valore} value={r.valore}>
              {r.etichetta}
            </option>
          ))}
        </select>
        <div className="mt-2 grid gap-1 text-[12px] text-muted-foreground">
          <button type="button" disabled={file.isPending} onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 text-left underline-offset-4 hover:text-foreground hover:underline pointer-coarse:min-h-9">
            <Upload className="size-3" aria-hidden /> {font.storage_path ? "Sostituisci il file" : "Carica il file (.ttf, .otf, .woff2) per vederlo davvero"}
          </button>
          <input
            ref={input}
            type="file"
            accept={ACCETTA_FONT}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) file.mutate({ font, file: f });
              e.target.value = "";
            }}
          />
          {font.storage_path ? (
            <button type="button" disabled={file.isPending} onClick={() => file.mutate({ font, file: null })} className="text-left underline-offset-4 hover:text-foreground hover:underline pointer-coarse:min-h-9">
              Togli il file, tieni il nome
            </button>
          ) : null}
          <button type="button" disabled={elimina.isPending} onClick={() => elimina.mutate(font)} className="inline-flex items-center gap-1.5 text-left underline-offset-4 hover:text-status-churn hover:underline pointer-coarse:min-h-9">
            <Trash2 className="size-3" aria-hidden /> Elimina il font
          </button>
        </div>
      </div>
    </li>
  );
}

/** Riga per aggiungere un font: nome + ruolo, senza popup. */
function NuovoFont({ clienteId, prossimoOrdine, ruoloSuggerito }: { clienteId: string; prossimoOrdine: number; ruoloSuggerito: RuoloFont }) {
  const aggiungi = useAggiungiFont(clienteId);
  const [nome, setNome] = useState("");
  const [ruolo, setRuolo] = useState<RuoloFont>(ruoloSuggerito);
  function invia() {
    if (!nome.trim()) return;
    aggiungi.mutate({ nome, ruolo, ordine: prossimoOrdine }, { onSuccess: () => setNome("") });
  }
  return (
    <form
      className="flex flex-wrap items-center gap-2 border-t border-dashed pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        invia();
      }}
    >
      <Plus className="size-4 text-muted-foreground" aria-hidden />
      <input
        type="text"
        value={nome}
        maxLength={120}
        placeholder="Nome del font, es. Playfair Display"
        aria-label="Nome del nuovo font"
        onChange={(e) => setNome(e.target.value)}
        className="h-9 min-w-48 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60 md:min-w-0 md:text-[15px]"
      />
      <select value={ruolo} aria-label="Ruolo del nuovo font" onChange={(e) => setRuolo(e.target.value as RuoloFont)} className="h-9 rounded-sm border bg-card px-2 text-base md:text-sm">
        {RUOLI_FONT.map((r) => (
          <option key={r.valore} value={r.valore}>
            {r.etichetta}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!nome.trim() || aggiungi.isPending} className="h-9 rounded-sm border px-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40">
        Aggiungi
      </button>
    </form>
  );
}

/** La tipografia del brand come campionario: un font per riga, composto davvero se c'è il file. */
export function SpecimenFont({ clienteId, font, nomeBrand }: SpecimenFontProps) {
  const ruoliUsati = new Set(font.map((f) => f.ruolo));
  const suggerito = (RUOLI_FONT.find((r) => !ruoliUsati.has(r.valore))?.valore ?? "accento") as RuoloFont;
  return (
    <section aria-labelledby="kit-font" className="grid gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="kit-font" className="eyebrow shrink-0 text-[10px]">
          Tipografia · {font.length}
        </h3>
        <span className="text-[12px] text-muted-foreground">{nomeBrand?.trim() ? "Composta con il nome del tuo brand" : "Scrivi il nome del brand in alto per vederlo composto qui"}</span>
      </div>
      {font.length > 0 ? (
        <ol className="grid">
          {font.map((f) => (
            <Campione key={f.id} font={f} clienteId={clienteId} nomeBrand={nomeBrand} />
          ))}
        </ol>
      ) : (
        <p className="font-display text-2xl text-muted-foreground">Nessun font ancora. Aggiungi quello dei titoli e quello dei testi.</p>
      )}
      {font.length < MAX_FONT ? <NuovoFont clienteId={clienteId} prossimoOrdine={(font.at(-1)?.ordine ?? -1) + 1} ruoloSuggerito={suggerito} /> : null}
    </section>
  );
}
