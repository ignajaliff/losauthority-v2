import { ExternalLink, Pencil } from "lucide-react";
import { Monogramma } from "@/shared/components/brand/Monogramma";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { piattaformaDi, type Concorrente } from "../types";

interface CardConcorrenteProps {
  concorrente: Concorrente;
  onModifica: (c: Concorrente) => void;
}

/** Una referenza: logo con le iniziali, nome, social, cosa fa e i video con la loro descrizione. */
export function CardConcorrente({ concorrente: c, onModifica }: CardConcorrenteProps) {
  return (
    <Card className="h-full">
      <CardHeader className="justify-items-center gap-3 text-center">
        <Monogramma nome={c.nome} dimensione="xl" className="rounded-full" />
        <CardTitle className="font-display text-2xl leading-tight font-medium wrap-anywhere">{c.nome}</CardTitle>
        {c.social.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-2">
            {c.social.map((url) => {
              const { etichetta, Icona } = piattaformaDi(url);
              return (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${etichetta} di ${c.nome}`}
                    title={etichetta}
                    className="inline-flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-input hover:text-foreground"
                  >
                    <Icona className="size-4" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardHeader>

      <CardContent className="grid flex-1 content-start gap-5">
        <section className="grid gap-1.5">
          <h3 className="eyebrow text-[10px]">Cosa fa</h3>
          {c.cosa_fa ? (
            <p className="text-sm leading-relaxed whitespace-pre-line wrap-anywhere">{c.cosa_fa}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Non hai ancora scritto cosa fa.</p>
          )}
        </section>

        <section className="grid gap-2">
          <h3 className="eyebrow text-[10px]">Video · {c.video.length}</h3>
          {c.video.length === 0 ? <p className="text-sm text-muted-foreground">Nessun video. Aggiungine uno da «Modifica».</p> : null}
          <ol className="grid gap-2.5">
            {c.video.map((v, i) => {
              const { etichetta, Icona } = piattaformaDi(v.url);
              return (
                <li key={v.id} className="grid gap-1 rounded-lg border bg-muted/40 p-3">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline pointer-coarse:min-h-9"
                  >
                    <Icona className="size-3.5 text-muted-foreground" aria-hidden />
                    Video {i + 1} · {etichetta}
                    <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
                  </a>
                  {v.descrizione ? (
                    <p className="text-[13px] leading-relaxed whitespace-pre-line text-muted-foreground wrap-anywhere">{v.descrizione}</p>
                  ) : (
                    <p className="text-[13px] text-muted-foreground/70">Senza descrizione.</p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button variant="outline" size="sm" onClick={() => onModifica(c)}>
          <Pencil aria-hidden /> Modifica
        </Button>
      </CardFooter>
    </Card>
  );
}
