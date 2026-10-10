/**
 * Elenco a sinistra dei tab Avatar e Offerta: sotto md, se le voci sono più d'una,
 * diventa una striscia orizzontale a tutta larghezza (bordo a bordo con il padding del gestionale).
 */
export const STRISCIA_MOBILE =
  "max-md:-mx-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scroll-px-4 max-md:overflow-x-auto max-md:px-4 max-md:pb-1 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden";

/** Ogni voce della striscia: larghezza fissa, così si intravede la successiva. */
export const VOCE_STRISCIA_MOBILE = "max-md:w-[min(16rem,78vw)] max-md:shrink-0 max-md:snap-start";
