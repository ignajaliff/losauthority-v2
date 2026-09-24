import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { esFinance, useAuth } from "@/features/auth";
import { ChiamateCliente } from "@/features/chiamate";
import { FattureCliente } from "@/features/fatture";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { BadgeFase, BadgeStatoOnboarding, BadgeTag } from "../components/BadgesCliente";
import { ImpostazioniTab } from "../components/ImpostazioniTab";
import { LinkRapidi } from "../components/LinkRapidi";
import { PanoramicaTab } from "../components/PanoramicaTab";
import { useCliente } from "../hooks/useCliente";

const TAB_DEFAULT = "panoramica";
const TAB_VALIDI = ["panoramica", "call", "fatture", "impostazioni"];

export default function SchedaClientePage() {
  const { id } = useParams<{ id: string }>();
  const { utente } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: cliente, isLoading, isError } = useCliente(id);
  const puoFinance = esFinance(utente?.rol ?? null);

  const richiesto = params.get("tab") ?? TAB_DEFAULT;
  const tab = TAB_VALIDI.includes(richiesto) && (richiesto !== "fatture" || puoFinance) ? richiesto : TAB_DEFAULT;

  function cambiaTab(v: string) {
    const next = new URLSearchParams(params);
    if (v === TAB_DEFAULT) next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  }

  if (!id) return <StatoVuoto titolo="Cliente non trovato" />;
  if (isLoading) return <SkeletonBlocco altezza="h-64" />;
  if (isError) return <ErroreCaricamento />;
  if (!cliente) return <StatoVuoto titolo="Cliente non trovato" testo="Forse è stato eliminato." />;

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <Link to="/clienti" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Clienti
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <h2 className="text-2xl font-semibold tracking-tight break-words">{cliente.utente.nombre}</h2>
          <p className="text-sm text-muted-foreground">{cliente.utente.email}</p>
          <div className="flex flex-wrap items-center gap-2">
            <BadgeFase fase={cliente.fase} />
            <BadgeStatoOnboarding stato={cliente.stato_onboarding} />
            <BadgeTag labels={cliente.tags.map((t) => t.label)} />
          </div>
        </div>
        <LinkRapidi notionHubUrl={cliente.notion_hub_url} instagram={cliente.instagram} tiktok={cliente.tiktok} telefono={cliente.telefono} />
      </header>

      <Tabs value={tab} onValueChange={(v) => cambiaTab(String(v))}>
        <TabsList>
          <TabsTrigger value="panoramica">Panoramica</TabsTrigger>
          <TabsTrigger value="call">Call</TabsTrigger>
          {puoFinance ? <TabsTrigger value="fatture">Fatture</TabsTrigger> : null}
          <TabsTrigger value="impostazioni">Impostazioni</TabsTrigger>
        </TabsList>
        <TabsContent value="panoramica" className="pt-4">
          <PanoramicaTab cliente={cliente} />
        </TabsContent>
        <TabsContent value="call" className="pt-4">
          <ChiamateCliente clienteId={cliente.id} />
        </TabsContent>
        {puoFinance ? (
          <TabsContent value="fatture" className="pt-4">
            <FattureCliente clienteId={cliente.id} />
          </TabsContent>
        ) : null}
        <TabsContent value="impostazioni" className="pt-4">
          <ImpostazioniTab cliente={cliente} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
