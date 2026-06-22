import type { MatchWithTeams } from "@/lib/types";
import { TeamCrest } from "@/components/team-badge";
import { formatKickoffShort } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Node {
  match: MatchWithTeams;
  children?: [Node, Node];
}

/** Una fila del cuadro: un equipo (o etiqueta) con su marcador. */
function Slot({
  team,
  label,
  score,
  win,
}: {
  team: MatchWithTeams["home_team"];
  label: string | null;
  score: number | null;
  win: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1", win && "bg-primary/10")}>
      <span className="shrink-0">
        <TeamCrest team={team} size={16} />
      </span>
      <span
        className={cn(
          "flex-1 truncate text-xs",
          win ? "font-bold text-foreground" : team ? "text-foreground" : "text-muted",
        )}
      >
        {team?.name ?? label ?? "Por definir"}
      </span>
      <span className={cn("shrink-0 text-xs tabular-nums", win ? "text-primary font-bold" : "text-muted")}>
        {score ?? ""}
      </span>
    </div>
  );
}

function MatchCard({ match }: { match: MatchWithTeams }) {
  const finished = match.status === "finished";
  const homeWin = finished && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWin = finished && (match.away_score ?? 0) > (match.home_score ?? 0);
  return (
    <div className="bk-card rounded-lg border border-border bg-card overflow-hidden">
      <div className="divide-y divide-border/60">
        <Slot team={match.home_team} label={match.home_label} score={match.home_score} win={homeWin} />
        <Slot team={match.away_team} label={match.away_label} score={match.away_score} win={awayWin} />
      </div>
      <div className="px-2 py-0.5 text-[9px] text-muted bg-surface/60 truncate">
        {formatKickoffShort(match.kickoff_at)}
        {match.city ? ` · ${match.city}` : ""}
      </div>
    </div>
  );
}

/** Nodo recursivo: subárbol a un lado, tarjeta del partido al otro. */
function BracketNode({ node, side }: { node: Node; side: "left" | "right" }) {
  if (!node.children) return <MatchCard match={node.match} />;
  return (
    <div className={cn("bk-node", side === "right" && "bk-right")}>
      <div className="bk-sub">
        <BracketNode node={node.children[0]} side={side} />
        <BracketNode node={node.children[1]} side={side} />
      </div>
      <div className="bk-link" />
      <MatchCard match={node.match} />
    </div>
  );
}

function pick(matches: MatchWithTeams[], stage: string) {
  return matches.filter((m) => m.stage === stage).sort((a, b) => a.id - b.id);
}

/** Arma el árbol emparejando partidos consecutivos de cada ronda. */
function buildSide(
  rootStage: MatchWithTeams,
  qf: MatchWithTeams[],
  r16: MatchWithTeams[],
  r32: MatchWithTeams[],
  qfIdx: [number, number],
): Node {
  const qfNode = (i: number): Node => ({
    match: qf[i],
    children: [r16Node(2 * i), r16Node(2 * i + 1)],
  });
  const r16Node = (i: number): Node => ({
    match: r16[i],
    children: [{ match: r32[2 * i] }, { match: r32[2 * i + 1] }],
  });
  return {
    match: rootStage,
    children: [qfNode(qfIdx[0]), qfNode(qfIdx[1])],
  };
}

export function Bracket({ matches }: { matches: MatchWithTeams[] }) {
  const r32 = pick(matches, "r32");
  const r16 = pick(matches, "r16");
  const qf = pick(matches, "qf");
  const sf = pick(matches, "sf");
  const final = pick(matches, "final")[0];

  // Necesitamos la estructura completa para dibujar el árbol.
  if (!final || sf.length < 2 || qf.length < 4 || r16.length < 8 || r32.length < 16) {
    return null;
  }

  // Mitad izquierda = SF[0] (alimentada por QF 0,1); derecha = SF[1] (QF 2,3).
  const leftSF: Node = buildSide(sf[0], qf, r16, r32, [0, 1]);
  const rightSF: Node = buildSide(sf[1], qf, r16, r32, [2, 3]);

  return (
    <div className="bk-wrap">
      <div className="bk-node mx-auto w-max">
        <BracketNode node={leftSF} side="left" />
        <div className="bk-hlink" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Final</span>
          <MatchCard match={final} />
        </div>
        <div className="bk-hlink" />
        <BracketNode node={rightSF} side="right" />
      </div>
    </div>
  );
}
