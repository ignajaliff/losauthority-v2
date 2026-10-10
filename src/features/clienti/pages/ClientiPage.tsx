import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Tags } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { TabellaClienti } from "../components/TabellaClienti";
import { FASI } from "../fasi";
import { useClienti } from "../hooks/useClienti";

const TUTTE = "tutte";
const VOCI_FASE = [{ value: TUTTE, label: "Tutte le fasi" }, ...FASI.map((f) => ({ value: f.value, label: f.label }))];

export default function ClientiPage() {
  const { data, isLoading, isError } = useClienti();
  const [testo, setTesto] = useState("");
  const [fase, setFase] = useState<string>(TUTTE);

  const righe = useMemo(() => {
    const q = testo.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (fase !== TUTTE && c.fase !== fase) return false;
      if (!q) return true;
      return (c.nombre ?? "").toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q);
    });
  }, [data, testo, fase]);

  return (
    <div>
      <PageHeader
        titolo="Clienti"
        sottotitolo={data ? `${data.length} ${data.length === 1 ? "cliente" : "clienti"} · ordinati per prossima call` : undefined}
        azioni={
          <>
            <Button variant="ghost" size="sm" render={<Link to="/tag" />}>
              <Tags aria-hidden />
              Gestisci tag
            </Button>
            <Button size="sm" render={<Link to="/clienti/nuovo" />}>
              <Plus aria-hidden />
              Nuovo cliente
            </Button>
          </>
        }
      />

      {/* Telefono: i due filtri a tutta larghezza, uno sotto l'altro. */}
      <div className="mb-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <div className="grid gap-1">
          <Label htmlFor="filtro-testo">Cerca</Label>
          <Input id="filtro-testo" className="sm:w-64" placeholder="Nome o email" value={testo} onChange={(e) => setTesto(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="filtro-fase">Fase</Label>
          <Select items={VOCI_FASE} value={fase} onValueChange={(v) => setFase(v ?? TUTTE)}>
            <SelectTrigger id="filtro-fase" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOCI_FASE.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? <SkeletonRighe righe={6} /> : null}
      {isError ? <ErroreCaricamento /> : null}
      {data && data.length === 0 ? (
        <StatoVuoto titolo="Nessun cliente ancora" testo="Crea il primo: riceverà email e password per accedere e completare l'onboarding." />
      ) : null}
      {data && data.length > 0 && righe.length === 0 ? <StatoVuoto titolo="Nessun cliente corrisponde ai filtri" /> : null}
      {righe.length > 0 ? <TabellaClienti righe={righe} /> : null}
    </div>
  );
}
