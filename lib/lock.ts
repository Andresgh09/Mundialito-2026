import type { Match } from "./types";

/** Minutos antes del pitazo en que se cierra la predicción. */
export const LOCK_MINUTES = 10;

/**
 * Una predicción está bloqueada si el partido ya terminó o si falta menos
 * de LOCK_MINUTES para el pitazo inicial. Fuente de verdad para cliente y
 * servidor — el servidor SIEMPRE revalida con esto, nunca confía en el cliente.
 */
export function isLocked(
  match: Pick<Match, "kickoff_at" | "status">,
  now: Date = new Date(),
): boolean {
  if (match.status === "finished") return true;
  const kickoff = new Date(match.kickoff_at).getTime();
  return now.getTime() >= kickoff - LOCK_MINUTES * 60_000;
}

/** Milisegundos restantes hasta que se bloquee (0 si ya bloqueado). */
export function msUntilLock(
  match: Pick<Match, "kickoff_at" | "status">,
  now: Date = new Date(),
): number {
  if (match.status === "finished") return 0;
  const lockAt = new Date(match.kickoff_at).getTime() - LOCK_MINUTES * 60_000;
  return Math.max(0, lockAt - now.getTime());
}
