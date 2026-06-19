import { createClient } from "@supabase/supabase-js";
import {
  fetchWorldCupFixtures,
  parseRound,
  isFinished,
  regulationScore,
  type ApiFixture,
} from "./apifootball";
import { scorePrediction } from "./scoring";
import type { Prediction } from "./types";

export interface SyncSummary {
  teams: number;
  matches: number;
  finished: number;
  recomputed: number;
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan credenciales de Supabase");
  return createClient(url, key, { auth: { persistSession: false } });
}

function code(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[^a-zA-Z ]/g, "")
    .trim()
    .slice(0, 3)
    .toUpperCase();
}

/**
 * Sincroniza el Mundial desde API-Football hacia Supabase:
 *  - upsert de equipos (con grupo y logo) y partidos (estadio, ciudad, hora),
 *  - marca finished + score de 90' en los terminados,
 *  - recalcula los puntos de las predicciones de esos partidos.
 * Idempotente: no toca predicciones de partidos no terminados.
 */
export async function runSync(apiKey: string): Promise<SyncSummary> {
  const fixtures = await fetchWorldCupFixtures(apiKey);
  const db = client();

  // 1) Equipos (id = id de API). Grupo se toma de los partidos de grupo.
  const teams = new Map<
    number,
    { id: number; name: string; code: string; logo_url: string; group_letter: string | null }
  >();
  const groupByTeam = new Map<number, string>();

  for (const f of fixtures) {
    const { group } = parseRound(f.league.round);
    for (const side of [f.teams.home, f.teams.away]) {
      if (!side?.id) continue;
      if (!teams.has(side.id)) {
        teams.set(side.id, {
          id: side.id,
          name: side.name,
          code: code(side.name),
          logo_url: side.logo ?? null as unknown as string,
          group_letter: null,
        });
      }
      if (group) groupByTeam.set(side.id, group);
    }
  }
  for (const [id, g] of groupByTeam) {
    const t = teams.get(id);
    if (t) t.group_letter = g;
  }

  if (teams.size > 0) {
    const { error } = await db
      .from("teams")
      .upsert([...teams.values()], { onConflict: "id" });
    if (error) throw new Error(`upsert teams: ${error.message}`);
  }

  // 2) Partidos
  const matchRows = [];
  const finishedActual = new Map<number, { home: number; away: number }>();

  for (const f of fixtures) {
    const { stage, group } = parseRound(f.league.round);
    const finished = isFinished(f.fixture.status.short);
    const actual = finished ? regulationScore(f) : null;
    if (finished && actual) finishedActual.set(f.fixture.id, actual);

    matchRows.push({
      id: f.fixture.id,
      stage,
      group_letter: group,
      home_team_id: f.teams.home?.id || null,
      away_team_id: f.teams.away?.id || null,
      kickoff_at: f.fixture.date,
      stadium: f.fixture.venue?.name ?? null,
      city: f.fixture.venue?.city ?? null,
      home_score: actual ? actual.home : null,
      away_score: actual ? actual.away : null,
      status: finished && actual ? "finished" : "scheduled",
    });
  }

  if (matchRows.length > 0) {
    const { error } = await db
      .from("matches")
      .upsert(matchRows, { onConflict: "id" });
    if (error) throw new Error(`upsert matches: ${error.message}`);
  }

  // 3) Recalcular puntos de las predicciones de partidos terminados.
  let recomputed = 0;
  const finishedIds = [...finishedActual.keys()];
  if (finishedIds.length > 0) {
    const { data: preds, error } = await db
      .from("predictions")
      .select("*")
      .in("match_id", finishedIds);
    if (error) throw new Error(`leer predicciones: ${error.message}`);

    const updated = (preds ?? []).map((p: Prediction) => {
      const actual = finishedActual.get(p.match_id)!;
      return {
        ...p,
        points: scorePrediction({ home: p.home_pred, away: p.away_pred }, actual),
      };
    });
    if (updated.length > 0) {
      const { error: upErr } = await db
        .from("predictions")
        .upsert(updated, { onConflict: "user_id,match_id" });
      if (upErr) throw new Error(`recalcular puntos: ${upErr.message}`);
      recomputed = updated.length;
    }
  }

  return {
    teams: teams.size,
    matches: matchRows.length,
    finished: finishedActual.size,
    recomputed,
  };
}
