import type { StandingRow } from "@/lib/standings";
import { TeamCrest } from "@/components/team-badge";
import { cn } from "@/lib/cn";

const COLS = [
  { key: "pj", label: "PJ" },
  { key: "g", label: "G" },
  { key: "e", label: "E" },
  { key: "p", label: "P" },
  { key: "gf", label: "GF" },
  { key: "gc", label: "GC" },
  { key: "dif", label: "DIF" },
] as const;

export function GroupTable({
  letter,
  rows,
}: {
  letter: string;
  rows: StandingRow[];
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 bg-elevated font-display font-bold text-sm">
        Grupo {letter}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted">
              <th className="text-left font-medium px-2 py-1.5 w-6">#</th>
              <th className="text-left font-medium py-1.5">Equipo</th>
              {COLS.map((c) => (
                <th key={c.key} className="font-medium px-1.5 py-1.5 text-center tabular-nums">
                  {c.label}
                </th>
              ))}
              <th className="font-semibold px-2 py-1.5 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const pos = i + 1;
              return (
                <tr
                  key={r.team.id}
                  className={cn(
                    "border-t border-border/60",
                    pos <= 2 && "bg-accent/10", // clasifican directo
                    pos === 3 && "bg-primary/5", // posible mejor tercero
                  )}
                >
                  <td className="px-2 py-2 text-muted tabular-nums">{pos}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamCrest team={r.team} size={20} />
                      <span className="truncate font-medium">{r.team.name}</span>
                    </div>
                  </td>
                  <td className="px-1.5 text-center tabular-nums text-muted">{r.pj}</td>
                  <td className="px-1.5 text-center tabular-nums text-muted">{r.g}</td>
                  <td className="px-1.5 text-center tabular-nums text-muted">{r.e}</td>
                  <td className="px-1.5 text-center tabular-nums text-muted">{r.p}</td>
                  <td className="px-1.5 text-center tabular-nums text-muted">{r.gf}</td>
                  <td className="px-1.5 text-center tabular-nums text-muted">{r.gc}</td>
                  <td className="px-1.5 text-center tabular-nums font-medium">
                    {r.dif > 0 ? `+${r.dif}` : r.dif}
                  </td>
                  <td className="px-2 text-center tabular-nums font-bold text-primary">
                    {r.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
