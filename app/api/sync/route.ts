import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Disparo manual desde el panel admin. */
export async function POST() {
  const user = await getSession();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  try {
    const summary = await runSync();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}

/**
 * Disparo por secreto (Authorization: Bearer <CRON_SECRET>).
 * Sirve para una sync programada futura o para correrla sin sesión.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const summary = await runSync();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
