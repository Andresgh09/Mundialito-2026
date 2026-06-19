import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getMatches } from "@/lib/queries";
import { AdminResultsBoard } from "@/components/admin-results-board";

export const dynamic = "force-dynamic";

export default async function AdminPartidosPage() {
  await requireAdmin();
  const matches = (await getMatches()).filter((m) => m.home_team && m.away_team);

  const initial: Record<number, { home: number; away: number } | null> = {};
  for (const m of matches) {
    initial[m.id] =
      m.status === "finished" && m.home_score != null && m.away_score != null
        ? { home: m.home_score, away: m.away_score }
        : null;
  }

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-3"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden /> Panel
      </Link>
      <header className="mb-4">
        <h1 className="font-display text-3xl font-bold">Resultados</h1>
        <p className="text-muted text-sm">
          Escribí el marcador real. Dejá ambos vacíos para borrar un resultado.
          Al <strong className="text-foreground">Guardar</strong> se recalculan los puntos.
        </p>
      </header>
      <AdminResultsBoard matches={matches} initial={initial} />
    </div>
  );
}
