import { useEffect, useState } from "react";
import { useLinkFileKit } from "./useFileKit";

/**
 * Carica il file di un font del kit nel browser (FontFace API) e restituisce la
 * `font-family` da usare: «kit-<id>» quando il file è pronto, null se il font
 * non ha file o non è ancora caricato (si mostra con la font della pagina).
 */
export function useFontFace(id: string, storagePath: string | null): string | null {
  const link = useLinkFileKit(storagePath);
  /** Il file caricato nel browser: path + nome famiglia. Se il path cambia, la famiglia non vale più (derivato, niente reset nell'effetto). */
  const [caricato, setCaricato] = useState<{ path: string; famiglia: string } | null>(null);

  useEffect(() => {
    if (!link.data || !storagePath) return;
    const nome = `kit-${id}`;
    const path = storagePath;
    let attivo = true;
    new FontFace(nome, `url("${link.data}")`)
      .load()
      .then((f) => {
        if (!attivo) return;
        document.fonts.add(f);
        setCaricato({ path, famiglia: nome });
      })
      .catch(() => undefined);
    return () => {
      attivo = false;
    };
  }, [id, storagePath, link.data]);

  return caricato && caricato.path === storagePath ? caricato.famiglia : null;
}
