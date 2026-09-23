export type Rol = "admin" | "staff" | "staff_fatture" | "cliente";

/** Ruoli che accedono al gestionale. */
export const RUOLI_TEAM: Rol[] = ["admin", "staff", "staff_fatture"];
/** Ruoli che vedono i soldi (Finance, importi delle fatture). */
export const RUOLI_FINANCE: Rol[] = ["admin", "staff_fatture"];

export function esTeam(rol: Rol | null): boolean {
  return rol !== null && RUOLI_TEAM.includes(rol);
}
export function esFinance(rol: Rol | null): boolean {
  return rol !== null && RUOLI_FINANCE.includes(rol);
}

export function etichettaRuolo(rol: string): string {
  if (rol === "admin") return "Admin";
  if (rol === "staff") return "Staff · Clienti";
  if (rol === "staff_fatture") return "Staff · Clienti + Fatture";
  return "Cliente";
}

export interface UtenteCorrente {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}
