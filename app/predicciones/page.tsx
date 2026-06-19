import { requireUser } from "@/lib/auth";
import { getMatches, getUserPredictions } from "@/lib/queries";
import { isLocked } from "@/lib/lock";
import { PredictionBoard } from "@/components/prediction-board";

export const dynamic = "force-dynamic";

export default async function PrediccionesPage() {
  const user = await requireUser();
  const [matches, preds] = await Promise.all([
    getMatches(),
    getUserPredictions(user.id),
  ]);

  // Editables: aún no bloqueados y con ambos equipos definidos.
  const open = matches.filter(
    (m) => !isLocked(m) && m.home_team && m.away_team,
  );

  const initial: Record<number, { home: number; away: number }> = {};
  for (const m of open) {
    const p = preds.get(m.id);
    if (p) initial[m.id] = { home: p.home_pred, away: p.away_pred };
  }

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-3xl font-bold">Tus predicciones</h1>
        <p className="text-muted text-sm">
          Marcá el marcador de cada partido. Se cierra 10 min antes del pitazo.
          Editá los que quieras y tocá <strong className="text-foreground">Guardar</strong> una sola vez.
        </p>
      </header>
      <PredictionBoard matches={open} initial={initial} />
    </div>
  );
}
