"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { scorePrediction } from "@/lib/scoring";
import type { Prediction } from "@/lib/types";

const scoreInt = z.number().int().min(0).max(99);

/** Recalcula points de todas las predicciones de un partido terminado. */
async function recomputeMatchPoints(
  db: ReturnType<typeof supabaseAdmin>,
  matchId: number,
  actual: { home: number; away: number } | null,
) {
  const { data: preds } = await db
    .from("predictions")
    .select("*")
    .eq("match_id", matchId);
  const list = (preds ?? []) as Prediction[];
  if (list.length === 0) return;

  const rows = list.map((p) => ({
    ...p,
    points:
      actual == null
        ? null
        : scorePrediction({ home: p.home_pred, away: p.away_pred }, actual),
  }));
  await db.from("predictions").upsert(rows, { onConflict: "user_id,match_id" });
}

const resultSchema = z.object({
  matchId: z.number().int().positive(),
  home: scoreInt.nullable(),
  away: scoreInt.nullable(),
});

/**
 * Carga/edita el resultado real de un partido. Si home/away son números, marca
 * el partido como `finished` y recalcula puntos. Si son null, lo limpia.
 */
export async function setMatchResult(input: {
  matchId: number;
  home: number | null;
  away: number | null;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  const { matchId, home, away } = parsed.data;

  const db = supabaseAdmin();
  const finished = home != null && away != null;

  const { error } = await db
    .from("matches")
    .update({
      home_score: finished ? home : null,
      away_score: finished ? away : null,
      status: finished ? "finished" : "scheduled",
    })
    .eq("id", matchId);
  if (error) return { ok: false, error: "No se pudo actualizar el partido" };

  await recomputeMatchPoints(db, matchId, finished ? { home, away } : null);

  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath("/");
  return { ok: true };
}

const resultsBatch = z.array(resultSchema).max(200);

/** Guardado por lote de resultados reales (varios partidos a la vez). */
export async function setMatchResults(
  rawItems: unknown,
): Promise<{ ok: boolean; saved: number; error?: string }> {
  await requireAdmin();
  const parsed = resultsBatch.safeParse(rawItems);
  if (!parsed.success) return { ok: false, saved: 0, error: "Datos inválidos" };
  const items = parsed.data;
  if (items.length === 0) return { ok: true, saved: 0 };

  const db = supabaseAdmin();
  for (const { matchId, home, away } of items) {
    const finished = home != null && away != null;
    const { error } = await db
      .from("matches")
      .update({
        home_score: finished ? home : null,
        away_score: finished ? away : null,
        status: finished ? "finished" : "scheduled",
      })
      .eq("id", matchId);
    if (error) return { ok: false, saved: 0, error: "Error al actualizar partidos" };
    await recomputeMatchPoints(db, matchId, finished ? { home, away } : null);
  }

  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath("/");
  return { ok: true, saved: items.length };
}

const backfillItem = z.object({
  user_id: z.string().uuid(),
  match_id: z.number().int().positive(),
  home: scoreInt,
  away: scoreInt,
});
const backfillSchema = z.array(backfillItem).max(2000);

/**
 * Backfill por lote: el admin teclea las predicciones históricas de cada
 * usuario. Para partidos ya terminados, calcula los puntos de inmediato.
 */
export async function saveBackfill(
  rawItems: unknown,
): Promise<{ ok: boolean; saved: number; error?: string }> {
  await requireAdmin();
  const parsed = backfillSchema.safeParse(rawItems);
  if (!parsed.success) return { ok: false, saved: 0, error: "Datos inválidos" };
  const items = parsed.data;
  if (items.length === 0) return { ok: true, saved: 0 };

  const db = supabaseAdmin();
  const matchIds = [...new Set(items.map((i) => i.match_id))];
  const { data: matches } = await db
    .from("matches")
    .select("id, home_score, away_score, status")
    .in("id", matchIds);
  const resultById = new Map(
    (matches ?? []).map((m) => [
      m.id,
      m.status === "finished" && m.home_score != null && m.away_score != null
        ? { home: m.home_score, away: m.away_score }
        : null,
    ]),
  );

  const now = new Date().toISOString();
  const rows = items.map((it) => {
    const actual = resultById.get(it.match_id) ?? null;
    return {
      user_id: it.user_id,
      match_id: it.match_id,
      home_pred: it.home,
      away_pred: it.away,
      points: actual
        ? scorePrediction({ home: it.home, away: it.away }, actual)
        : null,
      updated_at: now,
    };
  });

  const { error } = await db
    .from("predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });
  if (error) return { ok: false, saved: 0, error: "No se pudo guardar el backfill" };

  revalidatePath("/admin/predicciones");
  revalidatePath("/");
  return { ok: true, saved: rows.length };
}
