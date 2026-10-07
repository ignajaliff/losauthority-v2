import { BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { GruppoCorso } from "../types";

/** Un corso (capitolo Skool) con le sue lezioni. */
export function CardCorso({ gruppo }: { gruppo: GruppoCorso }) {
  const n = gruppo.lezioni.length;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{gruppo.corso}</CardTitle>
        <CardDescription>
          {n} {n === 1 ? "lezione" : "lezioni"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3">
          {gruppo.lezioni.map((l) => (
            <li key={l.id} className="flex items-start gap-2">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                {l.url ? (
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    {l.titolo}
                    <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
                  </a>
                ) : (
                  <span className="font-medium">{l.titolo}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
