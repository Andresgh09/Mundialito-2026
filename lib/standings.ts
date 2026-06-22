import type { MatchWithTeams, Team } from "./types";

export interface StandingRow {
  team: Team;
  pj: number; // jugados
  g: number; // ganados
  e: number; // empatados
  p: number; // perdidos
  gf: number; // goles a favor
  gc: number; // goles en contra
  dif: number; // diferencia
  pts: number; // puntos
}

/**
 * Tabla de posiciones por grupo, calculada de los partidos de grupo terminados.
 * Orden: puntos, dif, goles a favor, nombre (criterios FIFA simplificados).
 */
export function computeStandings(
  matches: MatchWithTeams[],
  teams: Team[],
): Map<string, StandingRow[]> {
  const byGroup = new Map<string, Map<number, StandingRow>>();

  // Inicializar cada grupo con sus equipos.
  for (const t of teams) {
    if (!t.group_letter) continue;
    if (!byGroup.has(t.group_letter)) byGroup.set(t.group_letter, new Map());
    byGroup.get(t.group_letter)!.set(t.id, {
      team: t,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      pts: 0,
    });
  }

  for (const m of matches) {
    if (
      m.stage !== "group" ||
      !m.group_letter ||
      m.status !== "finished" ||
      m.home_score == null ||
      m.away_score == null ||
      !m.home_team ||
      !m.away_team
    ) {
      continue;
    }
    const table = byGroup.get(m.group_letter);
    if (!table) continue;
    const home = table.get(m.home_team.id);
    const away = table.get(m.away_team.id);
    if (!home || !away) continue;

    home.pj++;
    away.pj++;
    home.gf += m.home_score;
    home.gc += m.away_score;
    away.gf += m.away_score;
    away.gc += m.home_score;

    if (m.home_score > m.away_score) {
      home.g++;
      home.pts += 3;
      away.p++;
    } else if (m.home_score < m.away_score) {
      away.g++;
      away.pts += 3;
      home.p++;
    } else {
      home.e++;
      away.e++;
      home.pts++;
      away.pts++;
    }
  }

  const result = new Map<string, StandingRow[]>();
  for (const [letter, table] of byGroup) {
    for (const row of table.values()) row.dif = row.gf - row.gc;
    const rows = [...table.values()].sort(
      (a, b) =>
        b.pts - a.pts ||
        b.dif - a.dif ||
        b.gf - a.gf ||
        a.team.name.localeCompare(b.team.name),
    );
    result.set(letter, rows);
  }
  return result;
}
