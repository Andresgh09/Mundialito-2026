import { getMatches, getTeams } from "@/lib/queries";
import { computeStandings } from "@/lib/standings";
import { GroupTable } from "@/components/group-table";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const [matches, teams] = await Promise.all([getMatches(), getTeams()]);
  const standings = computeStandings(matches, teams);
  const letters = [...standings.keys()].sort();

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <h1 className="font-display text-3xl font-bold">Fase de grupos</h1>
        <p className="text-muted text-sm">
          Posiciones en vivo. <span className="text-accent">Verde</span>: clasifican
          directo · <span className="text-primary">dorado</span>: mejores terceros.
        </p>
      </header>

      <div className="space-y-3">
        {letters.map((letter) => (
          <GroupTable key={letter} letter={letter} rows={standings.get(letter)!} />
        ))}
      </div>
    </div>
  );
}
