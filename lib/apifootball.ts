import type { Stage } from "./types";

/**
 * Cliente mínimo de API-Football (api-sports.io, plan free).
 * Doc: https://www.api-football.com/documentation-v3
 * El Mundial es league=1. Temporada 2026.
 */
export const WORLD_CUP_LEAGUE = 1;
export const WORLD_CUP_SEASON = 2026;

const BASE = "https://v3.football.api-sports.io";

export interface ApiFixture {
  fixture: {
    id: number;
    date: string; // ISO con offset
    status: { short: string };
    venue: { name: string | null; city: string | null };
  };
  league: { round: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

interface ApiResponse {
  errors: unknown;
  results: number;
  response: ApiFixture[];
}

export async function fetchWorldCupFixtures(apiKey: string): Promise<ApiFixture[]> {
  const url = `${BASE}/fixtures?league=${WORLD_CUP_LEAGUE}&season=${WORLD_CUP_SEASON}`;
  const res = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API-Football respondió ${res.status}`);
  }
  const data = (await res.json()) as ApiResponse;
  const errs = data.errors;
  if (errs && ((Array.isArray(errs) && errs.length) || (typeof errs === "object" && Object.keys(errs as object).length))) {
    throw new Error(`API-Football error: ${JSON.stringify(errs)}`);
  }
  return data.response ?? [];
}

/** Estados que consideramos partido TERMINADO (puntuamos sobre el 90'). */
const FINISHED = new Set(["FT", "AET", "PEN"]);

export function isFinished(statusShort: string): boolean {
  return FINISHED.has(statusShort);
}

/**
 * Convierte el "round" de API-Football a nuestra etapa + letra de grupo.
 * Ejemplos: "Group A - 1" → {stage:'group', group:'A'}, "Round of 32",
 * "Round of 16", "Quarter-finals", "Semi-finals", "3rd Place Final", "Final".
 */
export function parseRound(round: string): { stage: Stage; group: string | null } {
  const r = round.toLowerCase();
  const groupMatch = round.match(/group\s+([A-L])/i);
  if (groupMatch) return { stage: "group", group: groupMatch[1].toUpperCase() };
  if (r.includes("round of 32")) return { stage: "r32", group: null };
  if (r.includes("round of 16")) return { stage: "r16", group: null };
  if (r.includes("quarter")) return { stage: "qf", group: null };
  if (r.includes("semi")) return { stage: "sf", group: null };
  if (r.includes("3rd") || r.includes("third")) return { stage: "third", group: null };
  if (r.includes("final")) return { stage: "final", group: null };
  // Por defecto, tratamos como grupo sin letra para no perder el partido.
  return { stage: "group", group: null };
}

/** Score de tiempo reglamentario (90'); cae a goals si fulltime viene vacío. */
export function regulationScore(f: ApiFixture): { home: number; away: number } | null {
  const ft = f.score?.fulltime;
  if (ft && ft.home != null && ft.away != null) {
    return { home: ft.home, away: ft.away };
  }
  if (f.goals.home != null && f.goals.away != null) {
    return { home: f.goals.home, away: f.goals.away };
  }
  return null;
}
