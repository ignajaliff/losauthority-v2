import { tratti } from "@contratti/documento.ts";
import type { Blocco } from "@contratti/tipi.ts";

/** Testo con i tratti in grassetto (`**così**`), senza mai passare da HTML grezzo. */
export function Inline({ testo }: { testo: string }) {
  return (
    <>
      {tratti(testo).map((t, i) =>
        t.grassetto ? <strong key={i}>{t.testo}</strong> : <span key={i}>{t.testo}</span>,
      )}
    </>
  );
}

/** Il testo del contratto (o dell'informativa) come lo legge il cliente: una sola forma per pagina, PDF e impronta. */
export function TestoContratto({ blocchi }: { blocchi: Blocco[] }) {
  return (
    <div className="grid gap-2.5 text-[14.5px] leading-[1.62] text-foreground">
      {blocchi.map((b, i) => {
        switch (b.t) {
          case "pagina":
            return null;
          case "titolo":
            return (
              <h2 key={i} className="border-b pb-3 text-[28px] leading-[1.15]">
                {b.testo}
              </h2>
            );
          case "sezione":
            return (
              <h3 key={i} className={`font-sans text-[18px] font-semibold ${i === 0 ? "" : "mt-3.5"}`}>
                {b.testo}
              </h3>
            );
          case "articolo":
            return (
              <h4 key={i} className="mt-3.5 font-sans text-[15.5px] font-bold">
                {b.testo}
              </h4>
            );
          case "centro":
            return (
              <p key={i} className="text-center font-bold">
                {b.testo}
              </p>
            );
          case "voce":
            return (
              <p key={i} className="relative pl-[18px]">
                <span aria-hidden className="absolute left-1">
                  •
                </span>
                <Inline testo={b.testo} />
              </p>
            );
          case "nota":
            return (
              <p key={i} className="text-[12.5px] italic text-muted-foreground">
                {b.testo}
              </p>
            );
          default:
            return (
              <p key={i}>
                <Inline testo={b.testo} />
              </p>
            );
        }
      })}
    </div>
  );
}
