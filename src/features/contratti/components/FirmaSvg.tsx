import type { Firma } from "@contratti/tipi.ts";

interface FirmaSvgProps {
  firma: Firma;
  altezza?: number;
  colore?: string;
}

/** Disegna una firma salvata: i tratti del dito, o i contorni pieni della firma di Wesley ricavata da un'immagine. */
export function FirmaSvg({ firma, altezza = 70, colore = "#0c1140" }: FirmaSvgProps) {
  const d = firma.tratti
    .map((t) => {
      let s = "";
      for (let i = 0; i < t.length; i += 2) s += `${i === 0 ? "M" : "L"}${t[i]} ${t[i + 1]} `;
      // Un tocco singolo si chiude su sé stesso: con la punta tonda è un puntino.
      if (firma.pieno) s += "Z";
      else if (t.length === 2) s += `L${t[0]} ${t[1]}`;
      return s;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${firma.w} ${firma.h}`} role="img" aria-label="Firma" className="block w-auto max-w-full" style={{ height: altezza }}>
      {firma.pieno ? (
        <path d={d} fill={colore} fillRule="evenodd" />
      ) : (
        <path d={d} fill="none" stroke={colore} strokeWidth={Math.max(firma.w / 230, 1.5)} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
