import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { FinanceGrafico } from "../components/FinanceGrafico";
import { FinanceStats } from "../components/FinanceStats";
import { TabF24 } from "../components/TabF24";
import { TabFatture } from "../components/TabFatture";
import { TabSpese } from "../components/TabSpese";
import { TAB_FINANCE, type TabFinance } from "../types";

function esTab(valore: unknown): valore is TabFinance {
  return typeof valore === "string" && (TAB_FINANCE as readonly string[]).includes(valore);
}

/** Finance: numeri di testa, andamento mensile e tab Fatture / F24 / Spese (tab in URL: ?tab=). */
export default function FinancePage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabFinance = esTab(tabParam) ? tabParam : "fatture";

  function cambiaTab(valore: unknown) {
    if (!esTab(valore)) return;
    setParams(valore === "fatture" ? {} : { tab: valore }, { replace: true });
  }

  return (
    <>
      <PageHeader titolo="Finance" sottotitolo="Fatture, F24 e spese: come sta andando." />
      {/* grid-cols-1 (= minmax(0,1fr)): grafico e tabelle non allargano la pagina sul telefono. */}
      <div className="grid grid-cols-1 gap-6">
        <FinanceStats />
        <FinanceGrafico />

        <Tabs value={tab} onValueChange={cambiaTab}>
          <TabsList className="w-full pointer-coarse:group-data-horizontal/tabs:h-11 sm:w-fit">
            <TabsTrigger value="fatture">Fatture</TabsTrigger>
            <TabsTrigger value="f24">F24</TabsTrigger>
            <TabsTrigger value="spese">Spese</TabsTrigger>
          </TabsList>
          <TabsContent value="fatture" className="mt-4">
            <TabFatture />
          </TabsContent>
          <TabsContent value="f24" className="mt-4">
            <TabF24 />
          </TabsContent>
          <TabsContent value="spese" className="mt-4">
            <TabSpese />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
