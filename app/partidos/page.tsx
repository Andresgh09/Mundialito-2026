import { getSession } from "@/lib/auth";
import { getMatches, getAllPredictions, getProfiles } from "@/lib/queries";
import { isLocked } from "@/lib/lock";
import { STAGE_LABEL, type MatchWithTeams } from "@/lib/types";
import { TeamBadge } from "@/components/team-badge";
import { Venue } from "@/components/venue";
import { Card, CardContent } from "@/components/ui/card";
import { formatKickoff } from "@/lib/format";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

function PointsBadge({ points }: { points: number | null }) {
  if (points == null) return null;
  const styles =
    points === 3
      ? "bg-primary/20 text-primary"
      : points === 1
        ? "bg-accent/20 text-accent"
        : "bg-elevated text-muted";
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-bold", styles)}>
      +{points}
    </span>
  );
}

export default async function PartidosPage() {
  const [user, matches, predictions, profiles] = await Promise.all([
    getSession(),
    getMatches(),
    getAllPredictions(),
    getProfiles(),
  ]);

  const nameById = new Map(profiles.map((p) => [p.id, p.display_name]));
  const predsByMatch = new Map<number, typeof predictions>();
  for (const p of predictions) {
    if (!predsByMatch.has(p.match_id)) predsByMatch.set(p.match_id, []);
    predsByMatch.get(p.match_id)!.push(p);
  }

  // Mostrar primero los partidos sin terminar más próximos, luego los jugados.
  const playable = matches.filter((m) => m.home_team && m.away_team);

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <h1 className="font-display text-3xl font-bold">Partidos</h1>
        <p className="text-muted text-sm">
          Resultados y predicciones. Las predicciones de todos se ven cuando el
          partido se cierra.
        </p>
      </header>

      <div className="space-y-2">
        {playable.map((m: MatchWithTeams) => {
          const locked = isLocked(m);
          const finished = m.status === "finished";
          const mPreds = predsByMatch.get(m.id) ?? [];
          return (
            <Card key={m.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between text-xs text-muted mb-2">
                  <span>
                    {m.stage === "group" && m.group_letter
                      ? `Grupo ${m.group_letter}`
                      : STAGE_LABEL[m.stage]}
                  </span>
                  <span className="flex items-center gap-1">
                    {locked && !finished && <Lock className="h-3 w-3" aria-hidden />}
                    {formatKickoff(m.kickoff_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <TeamBadge team={m.home_team} className="flex-1" />
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-1 font-display text-xl font-bold tabular-nums",
                      finished ? "bg-elevated text-foreground" : "text-muted",
                    )}
                  >
                    {finished ? `${m.home_score} - ${m.away_score}` : "vs"}
                  </span>
                  <TeamBadge team={m.away_team} align="right" className="flex-1" />
                </div>

                <Venue stadium={m.stadium} city={m.city} className="mt-2 justify-center" />

                {locked && mPreds.length > 0 && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-xs font-medium text-muted hover:text-foreground list-none">
                      Ver {mPreds.length} predicción(es)
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {mPreds.map((p) => (
                        <li
                          key={p.id}
                          className={cn(
                            "flex items-center justify-between text-sm",
                            p.user_id === user?.id && "text-primary",
                          )}
                        >
                          <span className="truncate">{nameById.get(p.user_id) ?? "?"}</span>
                          <span className="flex items-center gap-2 tabular-nums">
                            {p.home_pred} - {p.away_pred}
                            <PointsBadge points={p.points} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
