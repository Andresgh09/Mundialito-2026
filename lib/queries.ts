import "server-only";
import { supabaseAdmin } from "./supabase-server";
import type { MatchWithTeams, Prediction, Profile, Team } from "./types";

const MATCH_SELECT =
  "*, home_team:home_team_id(*), away_team:away_team_id(*)";

export async function getMatches(): Promise<MatchWithTeams[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("matches")
    .select(MATCH_SELECT)
    .order("kickoff_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MatchWithTeams[];
}

export async function getTeams(): Promise<Team[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("teams").select("*").order("id");
  if (error) throw error;
  return (data ?? []) as Team[];
}

export async function getProfiles(): Promise<Profile[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("profiles")
    .select("id, display_name, is_admin, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("profiles")
    .select("id, display_name, is_admin, created_at")
    .eq("id", id)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function getConfig(key: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("app_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data?.value as string) ?? null;
}

export async function getUserPredictions(
  userId: string,
): Promise<Map<number, Prediction>> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("predictions")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  const map = new Map<number, Prediction>();
  for (const p of (data ?? []) as Prediction[]) map.set(p.match_id, p);
  return map;
}

export async function getAllPredictions(): Promise<Prediction[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("predictions").select("*");
  if (error) throw error;
  return (data ?? []) as Prediction[];
}

export interface LeaderRow {
  user_id: string;
  name: string;
  points: number;
  exact: number; // marcadores exactos (+3)
  result: number; // aciertos de resultado (+1)
  played: number; // predicciones ya puntuadas
}

/** Puntaje "base" arrastrado desde la quiniela anterior (por usuario). */
export interface Bonus {
  points: number;
  exact: number;
  result: number;
}

export async function getBonuses(): Promise<Map<string, Bonus>> {
  const raw = await getConfig("bonus");
  if (!raw) return new Map();
  try {
    const obj = JSON.parse(raw) as Record<string, Bonus>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

/** Ranking agregado. Datos chicos (grupo de amigos) → se agrega en JS. */
export async function getLeaderboard(): Promise<LeaderRow[]> {
  const [profiles, predictions, bonuses] = await Promise.all([
    getProfiles(),
    getAllPredictions(),
    getBonuses(),
  ]);

  const rows = new Map<string, LeaderRow>();
  for (const p of profiles) {
    rows.set(p.id, {
      user_id: p.id,
      name: p.display_name,
      points: 0,
      exact: 0,
      result: 0,
      played: 0,
    });
  }

  for (const pred of predictions) {
    const row = rows.get(pred.user_id);
    if (!row || pred.points == null) continue;
    row.points += pred.points;
    row.played += 1;
    if (pred.points === 3) row.exact += 1;
    else if (pred.points === 1) row.result += 1;
  }

  // Arrastre de la quiniela anterior (puntaje base).
  for (const [id, b] of bonuses) {
    const row = rows.get(id);
    if (!row) continue;
    row.points += b.points;
    row.exact += b.exact;
    row.result += b.result;
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      a.name.localeCompare(b.name),
  );
}
