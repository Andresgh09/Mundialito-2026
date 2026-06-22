import { getMatches } from "@/lib/queries";
import type { MatchWithTeams } from "@/lib/types";
import { Bracket } from "@/components/bracket";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatKickoffShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LlavePage() {
  const matches = await getMatches();
  const knockout = matches.filter((m) => m.stage !== "group");
  const third = knockout.find((m) => m.stage === "third");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-bold">Llave</h1>
        <p className="text-muted text-sm">
          El cuadro de eliminatorias. Deslizá de lado para ver toda la llave; se
          va llenando conforme avanza el Mundial.
        </p>
      </header>

      <Bracket matches={knockout} />

      {third && <ThirdPlace match={third} />}
    </div>
  );
}

function ThirdPlace({ match }: { match: MatchWithTeams }) {
  const finished = match.status === "finished";
  return (
    <section>
      <h2 className="font-display text-lg font-bold mb-2">Tercer lugar</h2>
      <Card className="max-w-sm">
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <TeamBadge team={match.home_team} label={match.home_label} className="flex-1" />
            <span className="shrink-0 rounded-lg px-3 py-1 font-display text-lg font-bold tabular-nums bg-elevated">
              {finished ? `${match.home_score} - ${match.away_score}` : "vs"}
            </span>
            <TeamBadge team={match.away_team} label={match.away_label} align="right" className="flex-1" />
          </div>
          <p className="mt-1.5 text-[11px] text-muted text-center">
            {formatKickoffShort(match.kickoff_at)}
            {match.city ? ` · ${match.city}` : ""}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
