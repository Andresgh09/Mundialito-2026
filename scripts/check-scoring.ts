/**
 * Test rápido del sistema de puntuación (sin DB).
 *   pnpm exec node --experimental-strip-types scripts/check-scoring.ts
 */
import { scorePrediction } from "../lib/scoring.ts";

let failed = 0;
function expect(pred: [number, number], actual: [number, number], want: number) {
  const got = scorePrediction(
    { home: pred[0], away: pred[1] },
    { home: actual[0], away: actual[1] },
  );
  const ok = got === want;
  if (!ok) failed++;
  console.log(
    `${ok ? "✓" : "✗"} pred ${pred[0]}-${pred[1]} vs real ${actual[0]}-${actual[1]} → ${got} (esperado ${want})`,
  );
}

// +3 marcador exacto
expect([2, 1], [2, 1], 3);
expect([0, 0], [0, 0], 3);
// +1 acierto de resultado (mismo signo) pero marcador distinto
expect([2, 0], [1, 0], 1); // ambos gana local
expect([1, 1], [3, 3], 1); // ambos empate
expect([0, 2], [1, 4], 1); // ambos gana visitante
// 0 fallo (signo distinto)
expect([2, 1], [1, 2], 0); // predijo local, ganó visitante
expect([1, 1], [2, 0], 0); // predijo empate, ganó local
expect([0, 1], [1, 1], 0); // predijo visitante, fue empate

console.log(failed === 0 ? "\nTODO OK ✓" : `\n${failed} FALLO(S) ✗`);
process.exit(failed === 0 ? 0 : 1);
