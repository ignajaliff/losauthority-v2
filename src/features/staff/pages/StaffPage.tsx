import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Card } from "@/shared/components/ui/card";
import { DialogPassword } from "../components/DialogPassword";
import { RigaStaff } from "../components/RigaStaff";
import { useAggiornaRuoloStaff, useResetPasswordStaff, useRimuoviStaff, useStaff } from "../hooks/useStaff";

interface PasswordMostrata {
  nombre: string;
  password: string;
}

export default function StaffPage() {
  const navigate = useNavigate();
  const { utente } = useAuth();
  const { data: team, isLoading, isError } = useStaff();
  const aggiornaRuolo = useAggiornaRuoloStaff();
  const resetPassword = useResetPasswordStaff();
  const rimuovi = useRimuoviStaff();
  const [mostrata, setMostrata] = useState<PasswordMostrata | null>(null);

  const occupato = aggiornaRuolo.isPending || resetPassword.isPending || rimuovi.isPending;

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
      <PageHeader
        titolo="Staff"
        sottotitolo="Chi accede al gestionale e con quali permessi."
        azioni={
          <button
            type="button"
            onClick={() => navigate("/staff/nuovo")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 pointer-coarse:h-9"
          >
            <Plus className="size-4" aria-hidden />
            Nuovo staff
          </button>
        }
      />

      {isLoading ? <SkeletonRighe righe={4} /> : null}
      {isError ? <ErroreCaricamento /> : null}
      {team && team.length === 0 ? <StatoVuoto titolo="Nessun membro del team" /> : null}
      {team && team.length > 0 ? (
        <Card className="py-0">
          <ul>
            {team.map((m) => (
              <RigaStaff
                key={m.id}
                membro={m}
                sonoIo={m.id === utente?.id}
                occupato={occupato}
                onCambiaRuolo={(rol) => aggiornaRuolo.mutate({ user_id: m.id, rol })}
                onResetPassword={() =>
                  resetPassword.mutate(m.id, {
                    onSuccess: (password) => setMostrata({ nombre: m.nombre || m.email, password }),
                  })
                }
                onRimuovi={() => rimuovi.mutate(m.id)}
              />
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Permessi:</strong> lo <strong>Staff · Clienti</strong> gestisce i
        clienti ma non vede mai i soldi (niente Finance, niente importi). Lo{" "}
        <strong>Staff · Clienti + Fatture</strong> gestisce anche fatture e Finance. L&apos;
        <strong>Admin</strong> fa tutto, incluse queste impostazioni.
      </p>

      <DialogPassword
        password={mostrata?.password ?? null}
        nombre={mostrata?.nombre ?? ""}
        onChiudi={() => setMostrata(null)}
      />
    </div>
  );
}
