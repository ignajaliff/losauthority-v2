import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { CredenzialiStaff } from "../components/CredenzialiStaff";
import { FormNuovoStaff } from "../components/FormNuovoStaff";
import { useCreaStaff } from "../hooks/useStaff";
import type { CredenzialiStaff as Credenziali } from "../types";

export default function NuovoStaffPage() {
  const crea = useCreaStaff();
  const [credenziali, setCredenziali] = useState<Credenziali | null>(null);

  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <Link to="/staff" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground pointer-coarse:min-h-9">
        <ArrowLeft className="size-4" aria-hidden />
        Staff
      </Link>
      <PageHeader
        titolo="Nuovo collaboratore (staff)"
        sottotitolo="Riceverà email e password per accedere al gestionale."
      />

      {credenziali ? (
        <CredenzialiStaff credenziali={credenziali} onAggiungiAltro={() => setCredenziali(null)} />
      ) : (
        <Card>
          <CardContent>
            <FormNuovoStaff
              invio={crea.isPending}
              onInvia={(values) => crea.mutate(values, { onSuccess: setCredenziali })}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
