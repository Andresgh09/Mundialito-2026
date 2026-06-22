import { getMatches } from "@/lib/queries";
import { STAGE_LABEL, type Stage, type MatchWithTeams } from "@/lib/types";
import { TeamBadge } from "@/components/team-badge";
import { Venue } from "@/components/venue";
import { Card, CardContent } from "@/components/ui/card";
import { formatKickoffShort } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const ROUNDS: Stage[] = ["r32", "r16", "qf", "sf", "third", "final"];

function Side({
  team,
  label,
  score,
  winner,
}: {
  team: MatchWithTeams["home_team"];
  label: string | null;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-1.5",
        winner && "font-bold",
      )}
    >
      <TeamBadge team={team} label={label} className="flex-1" />
      <span className={cn("shrink-0 tabular-nums text-lg", winner ? "text-primary" : "text-muted")}>
        {score ?? ""}
      </span>
    </div>
  );
}

function KnockoutCard({ m }: { m: MatchWithTeams }) {
  const finished = m.status === "finished";
  const homeWin = finished && (m.home_score ?? 0) > (m.away_score ?? 0);
  const awayWin = finished && (m.away_score ?? 0) > (m.home_score ?? 0);
  return (
    <Card>
      <CardContent className="py-2.5">
        <div className="flex items-center justify-between text-[11px] text-muted mb-1">
          <span>{formatKickoffShort(m.kickoff_at)}</span>
          {finished && <span className="text-accent">Final</span>}
        </div>
        <div className="divide-y divide-border/60">
          <Side team={m.home_team} label={m.home_label} score={m.home_score} winner={homeWin} />
          <Side team={m.away_team} label={m.away_label} score={m.away_score} winner={awayWin} />
        </div>
        <Venue stadium={m.stadium} city={m.city} className="mt-1.5" />
      </CardContent>
    </Card>
  );
}

export default async function LlavePage() {
  const matches = await getMatches();
  const byStage = new Map<Stage, MatchWithTeams[]>();
  for (const m of matches) {
    if (m.stage === "group") continue;
    if (!byStage.has(m.stage)) byStage.set(m.stage, []);
    byStage.get(m.stage)!.push(m);
  }

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="font-display text-3xl font-bold">Llave</h1>
        <p className="text-muted text-sm">
          Los cruces de eliminatoria. Se van llenando conforme avanza el Mundial.
        </p>
      </header>

      {ROUNDS.filter((s) => byStage.has(s)).map((stage) => {
        const list = (byStage.get(stage) ?? []).sort((a, b) => a.id - b.id);
        return (
          <section key={stage}>
            <h2 className="font-display text-lg font-bold mb-2 text-primary">
              {STAGE_LABEL[stage]}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((m) => (
                <KnockoutCard key={m.id} m={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
