import { Bookmark } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import type { Idea } from "../types";
import { CardIdea } from "./CardIdea";

interface SheetIdeeSalvateProps {
  idee: Idea[];
  occupato: boolean;
  onScarta: (idea: Idea) => void;
  onWorkflow: (idea: Idea) => void;
}

/** Pannello "Salvate": le idee confermate in attesa di entrare nel Workflow. */
export function SheetIdeeSalvate({ idee, occupato, onScarta, onWorkflow }: SheetIdeeSalvateProps) {
  return (
    <Sheet>
      <SheetTrigger render={<Button size="sm" variant="outline" />}>
        <Bookmark aria-hidden /> Salvate
        <span className="figure ml-1 rounded-full bg-muted px-1.5 text-[11px]">{idee.length}</span>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 overflow-x-hidden overflow-y-auto sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 py-[18px]">
          <SheetTitle className="font-display text-xl font-medium">Idee salvate</SheetTitle>
          <SheetDescription>Le proposte che hai confermato. Da qui le porti nel Workflow quando decidi di girarle.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 p-6">
          {idee.length === 0 ? (
            <StatoVuoto titolo="Nessuna idea salvata" testo="Quando una proposta di Aura ti convince, premi «Salva»." />
          ) : (
            idee.map((idea, i) => (
              <CardIdea key={idea.id} idea={idea} indice={i} occupato={occupato} onSalva={() => undefined} onScarta={onScarta} onWorkflow={onWorkflow} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
