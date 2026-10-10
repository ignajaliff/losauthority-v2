import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { AvatarVuoto, CardAvatarMini, useAvatars, useCreaAvatar } from "@/features/avatar";
import { primoNome } from "@/features/scheda";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

/** /area/cervello/avatar → gli avatar (clienti ideali) del cliente; il primo si crea parlando con Aura. */
export default function AvatarPage() {
  const { utente } = useAuth();
  const navigate = useNavigate();
  const clienteId = utente?.id ?? "";
  const lista = useAvatars(utente?.id);
  const crea = useCreaAvatar(clienteId);
  const nome = primoNome(utente?.nombre);

  function nuovo() {
    crea.mutate(undefined, { onSuccess: (r) => navigate(`/area/cervello/avatar/${r.avatar_id}`) });
  }

  const avatars = lista.data ?? [];
  return (
    <div className="grid gap-7">
      <Link to="/area/cervello" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground pointer-coarse:-my-2 pointer-coarse:min-h-9 pointer-coarse:py-2">
        <ArrowLeft className="size-3.5" aria-hidden /> Cervello del tuo branding
      </Link>
      <PageHeader
        occhiello={`Cervello del tuo branding${nome ? ` · ${nome}` : ""}`}
        titolo="Avatar"
        sottotitolo="Il tuo cliente ideale: chi è, cosa vuole, cosa lo blocca. Lo definisci parlando con Aura e la carta si compila da sola."
        azioni={
          avatars.length > 0 ? (
            <Button onClick={nuovo} disabled={crea.isPending}>
              <Plus aria-hidden /> {crea.isPending ? "Aura si prepara…" : "Nuovo avatar"}
            </Button>
          ) : null
        }
      />

      {lista.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {lista.isError ? <ErroreCaricamento /> : null}
      {lista.data && avatars.length === 0 ? <AvatarVuoto nome={nome} occupato={crea.isPending} onCrea={nuovo} /> : null}
      {avatars.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {avatars.map((a, i) => (
            <li key={a.id} className="min-w-0">
              <CardAvatarMini avatar={a} numero={i + 1} indice={i} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
