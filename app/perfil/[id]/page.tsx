import { notFound } from "next/navigation";
import { Target, Check, X } from "lucide-react";
import { getProfile, getMatches, getUserPredictions, getBonuses } from "@/lib/queries";
import { StageBadge } from "@/components/stage-badge";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatKickoffShort } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const [matches, preds, bonuses] = await Promise.all([
    getMatches(),
    getUserPredictions(id),
    getBonuses(),
  ]);

  const bonus = bonuses.get(id);
  let total = bonus?.points ?? 0;
  let exact = bonus?.exact ?? 0;
  let result = bonus?.result ?? 0;
  const matchById = new Map(matches.map((m) => [m.id, m]));

  // Predicciones de partidos ya jugados, ordenadas por fecha desc.
  const scored = [...preds.values()]
    .filter((p) => p.points != null)
    .sort((a, b) => {
      const ka = matchById.get(a.match_id)?.kickoff_at ?? "";
      const kb = matchById.get(b.match_id)?.kickoff_at ?? "";
      return kb.localeCompare(ka);
    });

  for (const p of scored) {
    total += p.points ?? 0;
    if (p.points === 3) exact++;
    else if (p.points === 1) result++;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-elevated text-xl font-bold text-primary">
          {profile.display_name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight">
            {profile.display_name}
          </h1>
          <p className="text-muted text-sm">
            {profile.is_admin ? "Administrador" : "Jugador"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Puntos" value={total} accent />
        <Stat label="Exactos" value={exact} />
        <Stat label="Resultados" value={result} />
      </div>
      {bonus && bonus.points > 0 && (
        <p className="text-center text-xs text-muted -mt-3">
          Incluye {bonus.points} pts de arrastre de la quiniela anterior.
        </p>
      )}

      <section>
        <h2 className="font-display text-xl font-bold mb-2">Historial</h2>
        {scored.length === 0 ? (
          <p className="text-muted text-sm py-6 text-center">
            Todavía no tiene partidos puntuados.
          </p>
        ) : (
          <div className="space-y-2">
            {scored.map((p) => {
              const m = matchById.get(p.match_id);
              if (!m) return null;
              const pts = p.points ?? 0;
              return (
                <Card key={p.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                      <StageBadge stage={m.stage} group={m.group_letter} />
                      <span>{formatKickoffShort(m.kickoff_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamBadge team={m.home_team} className="flex-1" />
                      <div className="shrink-0 text-center">
                        <div className="font-display text-lg font-bold tabular-nums">
                          {p.home_pred} - {p.away_pred}
                        </div>
                        <div className="text-[10px] text-muted">
                          real {m.home_score}-{m.away_score}
                        </div>
                      </div>
                      <TeamBadge team={m.away_team} align="right" className="flex-1" />
                      <ResultIcon points={pts} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <div
          className={cn(
            "font-display text-3xl font-bold tabular-nums",
            accent ? "text-primary" : "text-foreground",
          )}
        >
          {value}
        </div>
        <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      </CardContent>
    </Card>
  );
}

function ResultIcon({ points }: { points: number }) {
  if (points === 3)
    return <Target className="h-5 w-5 shrink-0 text-primary" aria-label="Marcador exacto" />;
  if (points === 1)
    return <Check className="h-5 w-5 shrink-0 text-accent" aria-label="Resultado acertado" />;
  return <X className="h-5 w-5 shrink-0 text-muted" aria-label="Fallo" />;
}
