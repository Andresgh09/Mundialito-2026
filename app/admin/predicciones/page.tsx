import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getMatches, getProfiles, getAllPredictions } from "@/lib/queries";
import { AdminBackfillBoard } from "@/components/admin-backfill-board";

export const dynamic = "force-dynamic";

export default async function AdminBackfillPage() {
  await requireAdmin();
  const [matches, profiles, predictions] = await Promise.all([
    getMatches(),
    getProfiles(),
    getAllPredictions(),
  ]);

  const playable = matches.filter((m) => m.home_team && m.away_team);

  const byUser: Record<string, Record<number, { home: number; away: number }>> = {};
  for (const p of predictions) {
    (byUser[p.user_id] ??= {})[p.match_id] = { home: p.home_pred, away: p.away_pred };
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
        <h1 className="font-display text-3xl font-bold">Backfill de predicciones</h1>
        <p className="text-muted text-sm">
          Elegí un jugador y cargá los marcadores que puso. Para partidos ya
          jugados, los puntos se calculan al guardar.
        </p>
      </header>

      {profiles.length === 0 ? (
        <p className="text-muted py-8 text-center">
          Todavía no hay jugadores registrados.
        </p>
      ) : (
        <AdminBackfillBoard profiles={profiles} matches={playable} byUser={byUser} />
      )}
    </div>
  );
}
