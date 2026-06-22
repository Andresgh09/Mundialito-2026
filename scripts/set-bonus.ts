/**
 * Arrastre de la quiniela anterior: guarda puntaje base por jugador en
 * app_config["bonus"] y borra predicciones de partidos YA jugados (para que el
 * base no se sume dos veces). De los próximos partidos en adelante todo suma
 * encima del base.
 *   node --env-file=.env.local --experimental-strip-types scripts/set-bonus.ts
 */
import { createClient } from "@supabase/supabase-js";

// substring (en minúsculas) para identificar el perfil → puntos / exactos.
const TARGETS: { match: string; points: number; exact: number }[] = [
  { match: "diego", points: 32, exact: 4 },
  { match: "nessy", points: 31, exact: 4 },
  { match: "lamine", points: 28, exact: 4 },
  { match: "el rick", points: 28, exact: 2 },
  { match: "esteban", points: 27, exact: 3 },
  { match: "cornejo", points: 27, exact: 2 },
  { match: "andres", points: 27, exact: 2 },
  { match: "danielinha", points: 26, exact: 3 },
  { match: "daniel molina", points: 25, exact: 3 },
  { match: "burgos", points: 25, exact: 2 },
  { match: "evelys", points: 24, exact: 1 },
  { match: "bryan", points: 24, exact: 1 },
  { match: "chiky", points: 22, exact: 2 },
  { match: "rodrigo", points: 18, exact: 4 },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan credenciales de Supabase");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, display_name");
  if (error) throw error;

  const bonus: Record<string, { points: number; exact: number; result: number }> = {};
  for (const t of TARGETS) {
    const p = (profiles ?? []).find((x) =>
      x.display_name.toLowerCase().includes(t.match),
    );
    if (!p) {
      console.log(`⚠️  sin perfil para "${t.match}" (¿no se registró aún?)`);
      continue;
    }
    bonus[p.id] = {
      points: t.points,
      exact: t.exact,
      result: t.points - 3 * t.exact,
    };
    console.log(
      `${p.display_name.padEnd(28)} → ${t.points} pts (${t.exact} exactos, ${t.points - 3 * t.exact} resultados)`,
    );
  }

  const { error: cfgErr } = await db
    .from("app_config")
    .upsert({ key: "bonus", value: JSON.stringify(bonus) }, { onConflict: "key" });
  if (cfgErr) throw cfgErr;

  // Solo REPORTAR predicciones de partidos ya jugados (no borra nada).
  const { data: finished } = await db
    .from("matches")
    .select("id")
    .eq("status", "finished");
  const ids = (finished ?? []).map((m) => m.id);
  if (ids.length) {
    const { count } = await db
      .from("predictions")
      .select("id", { count: "exact", head: true })
      .in("match_id", ids);
    console.log(
      `\nℹ️  Hay ${count ?? 0} predicción(es) en partidos ya jugados (revisar para no duplicar puntos).`,
    );
  }

  console.log(`\n✓ Arrastre guardado para ${Object.keys(bonus).length} jugadores.`);
}

main().catch((e) => {
  console.error("Error:", e.message ?? e);
  process.exit(1);
});
