/** Query keys del dominio chiamate: ["chiamate", "<entità>", id?]. */
export const CHIAVI_CHIAMATE = {
  tutte: ["chiamate"] as const,
  cliente: (clienteId: string) => ["chiamate", "cliente", clienteId] as const,
  nonAssegnate: ["chiamate", "non-assegnate"] as const,
  azioni: (chiamataId: string) => ["chiamate", "azioni", chiamataId] as const,
  faseCliente: (clienteId: string) => ["chiamate", "fase-cliente", clienteId] as const,
  clientiOpzioni: ["chiamate", "clienti-opzioni"] as const,
};
