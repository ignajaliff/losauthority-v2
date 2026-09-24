import { useAuth } from "@/features/auth";
import { FattureCliente } from "@/features/fatture";
import { primoNome } from "@/features/questionari";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useMioCliente } from "../hooks/useArea";
import { CardHub, CardSchede } from "../components/CardSchede";
import { CardChiamate, CardCompiti } from "../components/CardChiamateCompiti";

/** Hub dell'area cliente: schede, hub Notion, call, compiti e fatture proprie. */
export default function AreaPage() {
  const { utente } = useAuth();
  const { data: cliente } = useMioCliente(utente?.id);
  if (!utente) return null;

  const nome = primoNome(utente.nombre);

  return (
    <div className="grid gap-6">
      <PageHeader titolo={nome ? `Ciao, ${nome}` : "La tua area"} sottotitolo="Il tuo percorso Los Authority, in un posto solo." />

      {cliente?.notion_hub_url ? <CardHub url={cliente.notion_hub_url} /> : null}

      <CardSchede clienteId={utente.id} />
      <CardChiamate clienteId={utente.id} />
      <CardCompiti clienteId={utente.id} />

      <Card>
        <CardHeader>
          <CardTitle>Le tue fatture</CardTitle>
          <CardDescription>Le fatture del percorso e il loro stato di pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <FattureCliente clienteId={utente.id} soloLettura />
        </CardContent>
      </Card>
    </div>
  );
}
