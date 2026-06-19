/**
 * Sistema de puntuación Mundialito:
 *  +3  marcador exacto
 *  +1  acertar el resultado (1-X-2): ganó local / empate / ganó visitante
 *   0  fallo
 *
 * Se puntúa sobre el resultado de tiempo reglamentario (90'). En eliminatorias
 * NO se cuentan los penales (regla estándar de quiniela, ajustable).
 */

export type ScoreLike = { home: number; away: number };

/** -1 gana visitante · 0 empate · 1 gana local */
export function outcome(s: ScoreLike): -1 | 0 | 1 {
  return Math.sign(s.home - s.away) as -1 | 0 | 1;
}

/** Puntos de una predicción contra el resultado real. */
export function scorePrediction(pred: ScoreLike, actual: ScoreLike): 0 | 1 | 3 {
  if (pred.home === actual.home && pred.away === actual.away) return 3;
  if (outcome(pred) === outcome(actual)) return 1;
  return 0;
}

/** Etiqueta legible del tipo de acierto, para el desglose del perfil. */
export function scoreLabel(points: 0 | 1 | 3): "exacto" | "resultado" | "fallo" {
  if (points === 3) return "exacto";
  if (points === 1) return "resultado";
  return "fallo";
}
