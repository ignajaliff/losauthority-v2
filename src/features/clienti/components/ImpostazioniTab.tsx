import { useAuth } from "@/features/auth";
import type { ClienteDettaglio } from "../types";
import { AccessoCliente } from "./AccessoCliente";
import { EliminaCliente } from "./EliminaCliente";
import { FormDatiCliente } from "./FormDatiCliente";
import { FormStatoCliente } from "./FormStatoCliente";
import { TagCliente } from "./TagCliente";

/** Tab Impostazioni: dati, stato del percorso, tag, accesso, eliminazione. */
export function ImpostazioniTab({ cliente }: { cliente: ClienteDettaglio }) {
  const { utente } = useAuth();
  const eAdmin = utente?.rol === "admin";
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <FormDatiCliente key={`dati-${cliente.updated_at}`} cliente={cliente} />
        <div className="grid gap-6">
          <FormStatoCliente key={`stato-${cliente.updated_at}`} cliente={cliente} />
          <TagCliente key={`tag-${cliente.tags.map((t) => t.id).join(",")}`} cliente={cliente} />
          <AccessoCliente cliente={cliente} />
        </div>
      </div>
      {eAdmin ? <EliminaCliente cliente={cliente} /> : null}
    </div>
  );
}
