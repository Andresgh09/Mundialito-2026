import { cn } from "@/lib/cn";
import type { Team } from "@/lib/types";

/** Bandera + nombre/código de un equipo (o TBD si aún no se conoce). */
export function TeamBadge({
  team,
  align = "left",
  className,
}: {
  team: Team | null;
  align?: "left" | "right";
  className?: string;
}) {
  const flag = team?.flag_emoji || "🏳️";
  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        align === "right" && "flex-row-reverse text-right",
        className,
      )}
    >
      <span className="text-2xl leading-none shrink-0" aria-hidden>
        {flag}
      </span>
      <span className="font-medium truncate">
        {team?.name ?? "Por definir"}
      </span>
    </div>
  );
}
