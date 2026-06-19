import Link from "next/link";
import { CalendarCheck, Grid3x3, KeyRound, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getMatches, getProfiles, getConfig } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { SyncButton } from "@/components/sync-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [matches, profiles, joinCode] = await Promise.all([
    getMatches(),
    getProfiles(),
    getConfig("join_code"),
  ]);

  const finished = matches.filter((m) => m.status === "finished").length;
  const pending = matches.length - finished;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Panel admin</h1>
        <p className="text-muted text-sm">Cargá resultados y predicciones históricas.</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={<Users className="h-4 w-4" />} label="Jugadores" value={profiles.length} />
        <Stat icon={<CalendarCheck className="h-4 w-4" />} label="Jugados" value={finished} />
        <Stat icon={<Grid3x3 className="h-4 w-4" />} label="Pendientes" value={pending} />
      </div>

      <Card>
        <CardContent className="py-4 space-y-2">
          <p className="text-sm text-muted">
            Trae fixture, estadios y marcadores del Mundial desde API-Football.
            Se ejecuta solo cada 20 min, pero podés forzarlo acá.
          </p>
          <SyncButton />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <AdminLink
          href="/admin/partidos"
          title="Resultados de partidos"
          desc="Cargá o editá el marcador real. Recalcula puntos al guardar."
          icon={<CalendarCheck className="h-5 w-5 text-primary" />}
        />
        <AdminLink
          href="/admin/predicciones"
          title="Predicciones históricas (backfill)"
          desc="Teclear los marcadores que puso cada quien en partidos ya jugados."
          icon={<Grid3x3 className="h-5 w-5 text-primary" />}
        />
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <KeyRound className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <div>
            <p className="text-sm text-muted">Código de grupo para invitar amigos</p>
            <p className="font-display text-xl font-bold tracking-wide">{joinCode ?? "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <div className="flex justify-center text-muted mb-1">{icon}</div>
        <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      </CardContent>
    </Card>
  );
}

function AdminLink({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-elevated transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-3 py-4">
          <span className="shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
