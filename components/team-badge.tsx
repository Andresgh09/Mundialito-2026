import { cn } from "@/lib/cn";
import type { Team } from "@/lib/types";

/** Logo (o bandera/escudo) + nombre de un equipo (o TBD si aún no se conoce). */
export function TeamBadge({
  team,
  align = "left",
  className,
}: {
  team: Team | null;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        align === "right" && "flex-row-reverse text-right",
        className,
      )}
    >
      <TeamCrest team={team} />
      <span className="font-medium truncate">
        {team?.name ?? "Por definir"}
      </span>
    </div>
  );
}

/** Escudo del equipo: usa el logo de la API; cae a bandera emoji o genérica. */
export function TeamCrest({
  team,
  size = 24,
}: {
  team: Team | null;
  size?: number;
}) {
  if (team?.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logo_url}
        alt={team.name}
        width={size}
        height={size}
        loading="lazy"
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="leading-none shrink-0"
      style={{ fontSize: size * 0.9 }}
      aria-hidden
    >
      {team?.flag_emoji || "🏳️"}
    </span>
  );
}
