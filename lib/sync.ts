import { createClient } from "@supabase/supabase-js";
import {
  fetchFeed,
  TEAM_INFO,
  flagUrl,
  groupLetter,
  stageFromRound,
  toIso,
  cityFromLocation,
  knockoutLabel,
} from "./fixture";
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

function code(es: string): string {
  return es
    .normalize("NFD")
    .replace(/[^a-zA-Z ]/g, "")
    .trim()
    .slice(0, 3)
    .toUpperCase();
}

/**
 * Sincroniza el Mundial desde el feed gratuito hacia Supabase:
 *  - equipos (id estable, nombre en español, bandera y grupo),
 *  - partidos (estadio, ciudad, hora; etiquetas "2A" en eliminatorias),
 *  - marca finished + score y recalcula los puntos de esos partidos.
 * Idempotente. Lo dispara el admin a mano (botón) o por CLI (`pnpm fixture`).
 */
export async function runSync(): Promise<SyncSummary> {
  const feed = await fetchFeed();
  const db = client();
  const maxMatch = Math.max(...feed.map((m) => m.MatchNumber));

  // 1) Equipos: nombres (en inglés del feed) de los partidos de grupo.
  const groupNames = new Set<string>();
  const teamGroup = new Map<string, string>();
  for (const m of feed) {
    const g = groupLetter(m.Group);
    if (!g) continue;
    for (const n of [m.HomeTeam, m.AwayTeam]) {
      if (n in TEAM_INFO) {
        groupNames.add(n);
        teamGroup.set(n, g);
      }
    }
  }
  const sorted = [...groupNames].sort();
  const teamId = new Map<string, number>();
  sorted.forEach((n, i) => teamId.set(n, i + 1));

  const teamRows = sorted.map((n) => ({
    id: teamId.get(n)!,
    name: TEAM_INFO[n].es,
    code: code(TEAM_INFO[n].es),
    flag_emoji: TEAM_INFO[n].flag,
    logo_url: flagUrl(TEAM_INFO[n].iso),
    group_letter: teamGroup.get(n) ?? null,
  }));
  if (teamRows.length) {
    const { error } = await db.from("teams").upsert(teamRows, { onConflict: "id" });
    if (error) throw new Error(`upsert teams: ${error.message}`);
  }

  // 2) Partidos
  const matchRows = [];
  const finishedActual = new Map<number, { home: number; away: number }>();

  for (const m of feed) {
    const stage = stageFromRound(m.RoundNumber, m.MatchNumber, maxMatch);
    const finished = m.HomeTeamScore != null && m.AwayTeamScore != null;
    if (finished) {
      finishedActual.set(m.MatchNumber, {
        home: m.HomeTeamScore as number,
        away: m.AwayTeamScore as number,
      });
    }
    matchRows.push({
      id: m.MatchNumber,
      stage,
      group_letter: groupLetter(m.Group),
      home_team_id: teamId.get(m.HomeTeam) ?? null,
      away_team_id: teamId.get(m.AwayTeam) ?? null,
      home_label: knockoutLabel(m.HomeTeam),
      away_label: knockoutLabel(m.AwayTeam),
      kickoff_at: toIso(m.DateUtc),
      stadium: m.Location ?? null,
      city: m.Location ? cityFromLocation(m.Location) : null,
      home_score: finished ? m.HomeTeamScore : null,
      away_score: finished ? m.AwayTeamScore : null,
      status: finished ? "finished" : "scheduled",
    });
  }
  if (matchRows.length) {
    const { error } = await db.from("matches").upsert(matchRows, { onConflict: "id" });
    if (error) throw new Error(`upsert matches: ${error.message}`);
  }

  // 3) Recalcular puntos de las predicciones de partidos terminados.
  let recomputed = 0;
  const finishedIds = [...finishedActual.keys()];
  if (finishedIds.length) {
    const { data: preds, error } = await db
      .from("predictions")
      .select("*")
      .in("match_id", finishedIds);
    if (error) throw new Error(`leer predicciones: ${error.message}`);

    const updated = (preds ?? []).map((p: Prediction) => ({
      ...p,
      points: scorePrediction(
        { home: p.home_pred, away: p.away_pred },
        finishedActual.get(p.match_id)!,
      ),
    }));
    if (updated.length) {
      const { error: upErr } = await db
        .from("predictions")
        .upsert(updated, { onConflict: "user_id,match_id" });
      if (upErr) throw new Error(`recalcular puntos: ${upErr.message}`);
      recomputed = updated.length;
    }
  }

  return {
    teams: teamRows.length,
    matches: matchRows.length,
    finished: finishedActual.size,
    recomputed,
  };
}
