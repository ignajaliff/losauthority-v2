/** Query key del dominio clienti: ["clienti", "<entità>", id?]. */
export const chiaviClienti = {
  tutti: ["clienti"] as const,
  lista: ["clienti", "lista"] as const,
  cliente: (id: string) => ["clienti", "cliente", id] as const,
  note: (id: string) => ["clienti", "note", id] as const,
  hub: (id: string) => ["clienti", "hub", id] as const,
  analisi: (id: string) => ["clienti", "analisi", id] as const,
};

export const chiaviTag = {
  tutti: ["tag"] as const,
  lista: ["tag", "lista"] as const,
};
