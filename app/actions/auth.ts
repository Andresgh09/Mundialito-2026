"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createSession, destroySession, requireUser } from "@/lib/auth";

const nameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 letras")
  .max(24, "Máximo 24 caracteres");
const pinSchema = z
  .string()
  .regex(/^\d{4}$/, "El PIN debe ser de 4 dígitos");

export type AuthState = { error?: string; ok?: boolean };

/** Registro: código de grupo + nombre + PIN. El primer usuario es admin. */
export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = nameSchema.safeParse(formData.get("name"));
  const pin = pinSchema.safeParse(formData.get("pin"));
  const pin2 = String(formData.get("pin2") ?? "");
  const joinCode = String(formData.get("joinCode") ?? "").trim();

  if (!name.success) return { error: name.error.issues[0].message };
  if (!pin.success) return { error: pin.error.issues[0].message };
  if (pin.data !== pin2) return { error: "Los PIN no coinciden" };

  const db = supabaseAdmin();

  const { data: codeRow } = await db
    .from("app_config")
    .select("value")
    .eq("key", "join_code")
    .maybeSingle();
  if (!codeRow || joinCode.toUpperCase() !== String(codeRow.value).toUpperCase()) {
    return { error: "Código de grupo incorrecto" };
  }

  // ¿Nombre ya tomado? (case-insensitive)
  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .ilike("display_name", name.data)
    .maybeSingle();
  if (existing) return { error: "Ese nombre ya está en uso" };

  // El primer perfil registrado se vuelve admin.
  const { count } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true });
  const isAdmin = (count ?? 0) === 0;

  const pin_hash = await bcrypt.hash(pin.data, 10);
  const { data: created, error } = await db
    .from("profiles")
    .insert({ display_name: name.data, pin_hash, is_admin: isAdmin })
    .select("id, display_name, is_admin")
    .single();
  if (error || !created) return { error: "No se pudo crear el perfil. Intentá de nuevo." };

  await createSession({
    id: created.id,
    name: created.display_name,
    isAdmin: created.is_admin,
  });
  redirect("/predicciones");
}

/** Login: nombre + PIN. */
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  if (!name || !/^\d{4}$/.test(pin)) {
    return { error: "Nombre o PIN inválido" };
  }

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("id, display_name, pin_hash, is_admin")
    .ilike("display_name", name)
    .maybeSingle();

  // Comparar siempre para no filtrar si el nombre existe (timing).
  const hash = profile?.pin_hash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await bcrypt.compare(pin, hash);
  if (!profile || !ok) return { error: "Nombre o PIN incorrecto" };

  await createSession({
    id: profile.id,
    name: profile.display_name,
    isAdmin: profile.is_admin,
  });
  redirect("/predicciones");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/** Cambiar el PIN del usuario logueado (pide el PIN actual). */
export async function changePinAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = pinSchema.safeParse(formData.get("pin"));
  const next2 = String(formData.get("pin2") ?? "");

  if (!next.success) return { error: next.error.issues[0].message };
  if (next.data !== next2) return { error: "Los PIN nuevos no coinciden" };

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("pin_hash")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { error: "Perfil no encontrado" };

  const ok = await bcrypt.compare(current, profile.pin_hash);
  if (!ok) return { error: "El PIN actual es incorrecto" };

  const pin_hash = await bcrypt.hash(next.data, 10);
  const { error } = await db
    .from("profiles")
    .update({ pin_hash })
    .eq("id", user.id);
  if (error) return { error: "No se pudo actualizar el PIN" };

  return { ok: true };
}
