/**
 * Seed de Mundialito.
 *   Uso:  pnpm seed
 *   Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   y opcionalmente JOIN_CODE (por defecto MUNDIAL2026).
 *
 * Carga equipos desde data/world-cup-2026.json y genera los 72 partidos de
 * fase de grupos (round-robin de 4 equipos por grupo). Las eliminatorias se
 * crean luego desde /admin cuando se conozcan los clasificados.
 * Idempotente: usa upsert por id.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

type SeedTeam = {
  id: number;
  name: string;
  code: string;
  flag_emoji: string;
  group_letter: string;
};
type SeedData = { groupStageStart: string; teams: SeedTeam[] };

const data: SeedData = JSON.parse(
  readFileSync(join(root, "data", "world-cup-2026.json"), "utf8"),
);

// Round-robin de 4 equipos (método del círculo): 3 jornadas x 2 partidos.
const ROUND_ROBIN: [number, number][][] = [
  [[0, 1], [2, 3]],
  [[0, 2], [3, 1]],
  [[0, 3], [1, 2]],
];

function buildMatches() {
  const groups = new Map<string, SeedTeam[]>();
  for (const t of data.teams) {
    if (!groups.has(t.group_letter)) groups.set(t.group_letter, []);
    groups.get(t.group_letter)!.push(t);
  }

  const letters = [...groups.keys()].sort();
  const matches: {
    id: number;
    stage: string;
    group_letter: string;
    home_team_id: number;
    away_team_id: number;
    kickoff_at: string;
    status: string;
  }[] = [];

  // Repartir los 72 partidos en una ventana del 11 al 27 de junio para que
  // algunos queden en el pasado (bloqueados) y otros en el futuro (predecibles).
  const start = new Date(`${data.groupStageStart}T17:00:00Z`).getTime();
  const windowMs = 16 * 24 * 60 * 60 * 1000;
  let globalIndex = 0;
  const total = letters.length * 6;

  letters.forEach((letter, gi) => {
    const teams = groups.get(letter)!;
    ROUND_ROBIN.forEach((matchday, md) => {
      matchday.forEach(([a, b], mi) => {
        const id = gi * 6 + md * 2 + mi + 1;
        const kickoff = new Date(start + (globalIndex / total) * windowMs);
        kickoff.setUTCMinutes(0, 0, 0);
        matches.push({
          id,
          stage: "group",
          group_letter: letter,
          home_team_id: teams[a].id,
          away_team_id: teams[b].id,
          kickoff_at: kickoff.toISOString(),
          status: "scheduled",
        });
        globalIndex++;
      });
    });
  });
  return matches;
}

async function main() {
  console.log("→ Cargando equipos…");
  const teams = data.teams.map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    flag_emoji: t.flag_emoji,
    group_letter: t.group_letter,
  }));
  let r = await supabase.from("teams").upsert(teams, { onConflict: "id" });
  if (r.error) throw r.error;

  console.log("→ Generando partidos de fase de grupos…");
  const matches = buildMatches();
  r = await supabase.from("matches").upsert(matches, { onConflict: "id" });
  if (r.error) throw r.error;

  const joinCode = process.env.JOIN_CODE ?? "MUNDIAL2026";
  console.log(`→ Fijando código de grupo: ${joinCode}`);
  r = await supabase
    .from("app_config")
    .upsert({ key: "join_code", value: joinCode }, { onConflict: "key" });
  if (r.error) throw r.error;

  console.log(
    `✓ Seed completo: ${teams.length} equipos, ${matches.length} partidos de grupo.`,
  );
  console.log("  Las eliminatorias se agregan desde /admin/partidos.");
}

main().catch((e) => {
  console.error("✗ Error en el seed:", e.message ?? e);
  process.exit(1);
});
