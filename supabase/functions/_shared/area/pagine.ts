/**
 * Le pagine dell'area cliente a cui un sotto-compito può rimandare («Fallo
 * qui»): una sola lista, letta dal browser (alias `@area/*`) e da `aura-compiti`
 * (Aura sceglie la pagina per CHIAVE, il percorso lo mettiamo noi). Le chiavi
 * sono il check della colonna `compiti.pagina` (migrazione 49): aggiungerne una
 * = migrazione. Testo in italiano: `descrizione` è per Aura, `titolo` per il cliente.
 */
export interface PaginaArea {
  chiave: string;
  titolo: string;
  percorso: string;
  descrizione: string;
}

export const PAGINE_AREA: readonly PaginaArea[] = [
  { chiave: "avatar", titolo: "Avatar", percorso: "/area/cervello/avatar", descrizione: "costruire o rivedere l'avatar (cliente ideale) parlando con Aura" },
  { chiave: "offerta", titolo: "Offerta", percorso: "/area/cervello/offerta", descrizione: "costruire o rivedere l'offerta (cosa vende, a chi, prezzo, garanzia) con Aura, con PDF scaricabile" },
  { chiave: "concorrenti", titolo: "Competitors", percorso: "/area/cervello/concorrenti", descrizione: "salvare i competitor e i profili di riferimento con i loro video" },
  { chiave: "kit_brand", titolo: "Kit Brand", percorso: "/area/cervello/kit-brand", descrizione: "salvare logo, colori (hex), font, tono di voce e documenti del brand: Aura li legge in ogni lavoro" },
  { chiave: "crea_idee", titolo: "Crea idee", percorso: "/area/crea-idee", descrizione: "farsi proporre idee di video da Aura (hook e script)" },
  { chiave: "ricerca_tiktok", titolo: "Ricerca TikTok", percorso: "/area/crea-idee/ricerca-tiktok", descrizione: "cercare i video TikTok più visti degli ultimi 6 mesi su un tema" },
  { chiave: "stili", titolo: "Stili", percorso: "/area/stili", descrizione: "salvare uno stile di video da replicare partendo da script di esempio" },
  { chiave: "workflow", titolo: "Workflow", percorso: "/area/workflow", descrizione: "la kanban dei video: idea → script → da registrare → da editare → pubblicato, con calendario" },
  { chiave: "pubblicazioni", titolo: "Pubblicazioni", percorso: "/area/pubblicazioni", descrizione: "collegare Instagram e seguire visualizzazioni, follower e crescita dei video pubblicati" },
  { chiave: "clienti", titolo: "Clienti", percorso: "/area/clienti", descrizione: "il CRM dei lead e clienti del cliente (da dove arrivano, stato, offerta)" },
  { chiave: "coach", titolo: "Wesley Coach", percorso: "/area/coach", descrizione: "chiedere ad Aura quale lezione Skool guardare per un blocco" },
] as const;

export const CHIAVI_PAGINE = PAGINE_AREA.map((p) => p.chiave);

export function paginaArea(chiave: string | null | undefined): PaginaArea | null {
  return PAGINE_AREA.find((p) => p.chiave === chiave) ?? null;
}

/** Le pagine per il prompt di Aura: "chiave — titolo: a cosa serve". */
export function pagineInTesto(): string {
  return PAGINE_AREA.map((p) => `${p.chiave} — ${p.titolo}: ${p.descrizione}`)
    .join("\n");
}
