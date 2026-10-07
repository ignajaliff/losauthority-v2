import { useAuth } from "@/features/auth";
import { AssistenzaCrm } from "@/features/crm";
import type { ClienteDettaglio } from "../types";
import { AccessoCliente } from "./AccessoCliente";
import { EliminaCliente } from "./EliminaCliente";
import { FormDatiCliente } from "./FormDatiCliente";
import { FormStatoCliente } from "./FormStatoCliente";
import { SincronizzaInstagram } from "./SincronizzaInstagram";
import { TagCliente } from "./TagCliente";

/** Tab Impostazioni: dati, stato del percorso, tag, accesso, sezione Clienti (assistenza), eliminazione. */
export function ImpostazioniTab({ cliente }: { cliente: ClienteDettaglio }) {
  const { utente } = useAuth();
  const eAdmin = utente?.rol === "admin";
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <FormDatiCliente key={`dati-${cliente.updated_at}`} cliente={cliente} />
        <div className="grid gap-6">
          <FormStatoCliente key={`stato-${cliente.updated_at}`} cliente={cliente} />
          <TagCliente key={`tag-${cliente.tags.join(",")}`} cliente={cliente} />
          <SincronizzaInstagram cliente={cliente} />
          <AccessoCliente cliente={cliente} />
          <AssistenzaCrm clienteId={cliente.id} nomeCliente={cliente.utente.nombre} />
        </div>
      </div>
      {eAdmin ? <EliminaCliente cliente={cliente} /> : null}
    </div>
  );
}
