import { useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { esFinance, useAuth } from "@/features/auth";
import { ChiamateCliente } from "@/features/chiamate";
import { FattureCliente } from "@/features/fatture";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { AvatarTab } from "../components/AvatarTab";
import { BadgeFase, BadgeStatoOnboarding, BadgeTag } from "../components/BadgesCliente";
import { ImpostazioniTab } from "../components/ImpostazioniTab";
import { LinkRapidi } from "../components/LinkRapidi";
import { OffertaTab } from "../components/OffertaTab";
import { OnboardingTab } from "../components/OnboardingTab";
import { PanoramicaTab } from "../components/PanoramicaTab";
import { useCliente } from "../hooks/useCliente";

const TAB_DEFAULT = "panoramica";
const TAB_VALIDI = ["panoramica", "onboarding", "avatar", "offerta", "call", "fatture", "impostazioni"];

export default function SchedaClientePage() {
  const { id } = useParams<{ id: string }>();
  const { utente } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: cliente, isLoading, isError } = useCliente(id);
  const puoFinance = esFinance(utente?.rol ?? null);
  const barraTab = useRef<HTMLDivElement>(null);
  const caricato = Boolean(cliente);

  const richiesto = params.get("tab") ?? TAB_DEFAULT;
  const tab = TAB_VALIDI.includes(richiesto) && (richiesto !== "fatture" || puoFinance) ? richiesto : TAB_DEFAULT;

  // Sul telefono la barra dei tab scorre in orizzontale: il tab attivo (anche aperto da ?tab=) resta in vista.
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767.98px)").matches) return;
    const lista = barraTab.current?.querySelector<HTMLElement>("[data-slot=tabs-list]");
    const attivo = lista?.querySelector<HTMLElement>("[aria-selected=true]");
    if (!lista || !attivo || lista.scrollWidth <= lista.clientWidth) return;
    const l = lista.getBoundingClientRect();
    const a = attivo.getBoundingClientRect();
    lista.scrollBy({ left: a.left - l.left - (l.width - a.width) / 2, behavior: "smooth" });
  }, [tab, caricato]);

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
      <Link
        to="/clienti"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pointer-coarse:-my-2 pointer-coarse:py-2"
      >
        <ArrowLeft className="size-4" aria-hidden /> Clienti
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <h2 className="text-[28px] leading-[1.1] break-words sm:text-[32px]">{cliente.utente.nombre}</h2>
          <p className="text-sm break-words text-muted-foreground">{cliente.utente.email}</p>
          <div className="flex flex-wrap items-center gap-2">
            {cliente.da_attivare ? (
              <Badge variant="expiring" dot>
                Da attivare
              </Badge>
            ) : null}
            <BadgeFase fase={cliente.fase} />
            <BadgeStatoOnboarding stato={cliente.stato_onboarding} />
            <BadgeTag labels={cliente.tags} />
          </div>
        </div>
        <LinkRapidi notionHubUrl={cliente.notion_hub_url} instagram={cliente.instagram} tiktok={cliente.tiktok} telefono={cliente.telefono} />
      </header>

      <Tabs value={tab} onValueChange={(v) => cambiaTab(String(v))}>
        <div ref={barraTab}>
          <TabsList variant="line">
            <TabsTrigger value="panoramica">Panoramica</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="offerta">Offerta</TabsTrigger>
            <TabsTrigger value="call">Call</TabsTrigger>
            {puoFinance ? <TabsTrigger value="fatture">Fatture</TabsTrigger> : null}
            <TabsTrigger value="impostazioni">Impostazioni</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="panoramica" className="pt-4">
          <PanoramicaTab cliente={cliente} />
        </TabsContent>
        <TabsContent value="onboarding" className="pt-4">
          <OnboardingTab cliente={cliente} />
        </TabsContent>
        <TabsContent value="avatar" className="pt-4">
          <AvatarTab cliente={cliente} />
        </TabsContent>
        <TabsContent value="offerta" className="pt-4">
          <OffertaTab cliente={cliente} />
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
