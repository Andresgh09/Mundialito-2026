"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isLocked } from "@/lib/lock";

const scoreInt = z.number().int().min(0).max(99);
const itemSchema = z.object({
  match_id: z.number().int().positive(),
  home: scoreInt,
  away: scoreInt,
});
const payloadSchema = z.array(itemSchema).max(120);

export type SaveResult = {
  ok: boolean;
  saved: number;
  skipped: number;
  error?: string;
};

/**
 * Guardado por lote de las predicciones del usuario logueado.
 * Revalida el bloqueo (kickoff − 10 min) en el SERVIDOR: las filas de partidos
 * ya bloqueados se rechazan aunque el cliente las mande.
 */
export async function savePredictions(
  rawItems: unknown,
): Promise<SaveResult> {
  const user = await requireUser();

  const parsed = payloadSchema.safeParse(rawItems);
  if (!parsed.success) {
    return { ok: false, saved: 0, skipped: 0, error: "Datos inválidos" };
  }
  const items = parsed.data;
  if (items.length === 0) return { ok: true, saved: 0, skipped: 0 };

  const db = supabaseAdmin();
  const ids = [...new Set(items.map((i) => i.match_id))];
  const { data: matches, error } = await db
    .from("matches")
    .select("id, kickoff_at, status")
    .in("id", ids);
  if (error) return { ok: false, saved: 0, skipped: 0, error: "Error de base de datos" };

  const lockedById = new Map(
    (matches ?? []).map((m) => [m.id, isLocked(m)]),
  );
  const now = new Date().toISOString();

  const rows = [];
  let skipped = 0;
  for (const it of items) {
    const locked = lockedById.get(it.match_id);
    if (locked === undefined || locked) {
      skipped++;
      continue;
    }
    rows.push({
      user_id: user.id,
      match_id: it.match_id,
      home_pred: it.home,
      away_pred: it.away,
      updated_at: now,
    });
  }

  if (rows.length > 0) {
    const { error: upErr } = await db
      .from("predictions")
      .upsert(rows, { onConflict: "user_id,match_id" });
    if (upErr) {
      return { ok: false, saved: 0, skipped, error: "No se pudieron guardar" };
    }
  }

  revalidatePath("/predicciones");
  revalidatePath("/");
  return { ok: true, saved: rows.length, skipped };
}
