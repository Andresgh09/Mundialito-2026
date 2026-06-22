/**
 * Crea perfiles pre-armados con PIN temporal aleatorio (para invitar gente).
 * Uso: node --env-file=.env.local --experimental-strip-types scripts/create-players.ts
 * Idempotente: si el nombre ya existe, lo salta. Imprime nombre + PIN temporal
 * para que el admin se los reparta. Cada persona cambia su PIN en /cuenta.
 */
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const NAMES = [
  "Diego Verdaguer",
  "Esteban Ramirez",
  "El Rick",
  "Roberto Burgos",
  "Roberto Cornejo Villarreal",
  "Daniel Molina",
  "Chiky Jen",
  "Evelysiña",
  "Rodrigo Morales",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan credenciales de Supabase en .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function main() {
  const out: { name: string; pin: string; status: string }[] = [];
  for (const name of NAMES) {
    const { data: existing } = await db
      .from("profiles")
      .select("id")
      .ilike("display_name", name)
      .maybeSingle();
    if (existing) {
      out.push({ name, pin: "—", status: "ya existía (saltado)" });
      continue;
    }
    const pin = randomPin();
    const pin_hash = await bcrypt.hash(pin, 10);
    const { error } = await db
      .from("profiles")
      .insert({ display_name: name, pin_hash, is_admin: false });
    out.push({ name, pin, status: error ? `ERROR: ${error.message}` : "creado" });
  }

  console.log("\n=== Credenciales temporales (repartir a cada uno) ===\n");
  for (const r of out) {
    console.log(`${r.name.padEnd(28)} | PIN: ${r.pin.padEnd(5)} | ${r.status}`);
  }
  console.log("\nCada persona entra con su nombre + PIN y lo cambia en /cuenta (la llavecita).");
}

main().catch((e) => {
  console.error("Error:", e.message ?? e);
  process.exit(1);
});
