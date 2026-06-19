/**
 * Pozo de la quiniela. 14 jugadores × ₡10.000 = ₡140.000.
 * Reparto: 1º ₡100.000 · 2º ₡30.000 · 3º ₡10.000.
 * Editá acá si cambian los montos o la cantidad de jugadores.
 */
export const ENTRY_FEE = 10_000;
export const PLAYERS = 14;
export const TOTAL_POT = ENTRY_FEE * PLAYERS; // ₡140.000

export const PRIZES: { place: number; amount: number; label: string }[] = [
  { place: 1, amount: 100_000, label: "1er lugar" },
  { place: 2, amount: 30_000, label: "2do lugar" },
  { place: 3, amount: 10_000, label: "3er lugar" },
];

/** Premio para una posición del ranking (1-indexed), o null. */
export function prizeForRank(rank: number): number | null {
  return PRIZES.find((p) => p.place === rank)?.amount ?? null;
}

const crc = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

/** ₡100.000 */
export function formatCRC(amount: number): string {
  return crc.format(amount);
}
