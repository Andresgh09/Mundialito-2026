import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getLeaderboard, getMatches } from "@/lib/queries";
import { isLocked } from "@/lib/lock";
import { Leaderboard } from "@/components/leaderboard";
import { PrizePool } from "@/components/prize-pool";
import { TeamBadge } from "@/components/team-badge";
import { Venue } from "@/components/venue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKickoffShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, rows, matches] = await Promise.all([
    getSession(),
    getLeaderboard(),
    getMatches(),
  ]);

  const upcoming = matches
    .filter((m) => !isLocked(m) && m.home_team && m.away_team)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <header className="text-center pt-2">
        <h1 className="font-display text-4xl font-bold">Ranking</h1>
        <p className="text-muted">Mundial 2026 · la quiniela entre amigos</p>
      </header>

      <PrizePool />

      {!user && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <p className="text-sm">
              <strong>¿Querés jugar?</strong> Creá tu perfil con un PIN.
            </p>
            <Link href="/registro">
              <Button size="sm">
                Unirme <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Leaderboard rows={rows} currentUserId={user?.id} />

      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl font-bold">Próximos partidos</h2>
            <Link
              href={user ? "/predicciones" : "/login"}
              className="text-sm font-semibold text-primary hover:text-gold-soft"
            >
              Predecir
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2">
                    <TeamBadge team={m.home_team} className="flex-1" />
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {formatKickoffShort(m.kickoff_at)}
                    </span>
                    <TeamBadge team={m.away_team} align="right" className="flex-1" />
                  </div>
                  <Venue stadium={m.stadium} city={m.city} className="mt-2 justify-center" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
