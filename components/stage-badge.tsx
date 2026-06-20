import { STAGE_LABEL, type Stage } from "@/lib/types";
import { cn } from "@/lib/cn";

// Color por grupo (A–L) para darle vida al fixture.
const GROUP_COLORS: Record<string, string> = {
  A: "bg-rose-500/15 text-rose-300",
  B: "bg-orange-500/15 text-orange-300",
  C: "bg-amber-500/15 text-amber-300",
  D: "bg-lime-500/15 text-lime-300",
  E: "bg-emerald-500/15 text-emerald-300",
  F: "bg-teal-500/15 text-teal-300",
  G: "bg-cyan-500/15 text-cyan-300",
  H: "bg-sky-500/15 text-sky-300",
  I: "bg-indigo-500/15 text-indigo-300",
  J: "bg-violet-500/15 text-violet-300",
  K: "bg-fuchsia-500/15 text-fuchsia-300",
  L: "bg-pink-500/15 text-pink-300",
};

/** Chip de color con "Grupo X" o el nombre de la etapa de eliminatoria. */
export function StageBadge({
  stage,
  group,
  className,
}: {
  stage: Stage;
  group: string | null;
  className?: string;
}) {
  const isGroup = stage === "group" && group;
  const color = isGroup
    ? GROUP_COLORS[group!] ?? "bg-elevated text-muted"
    : "bg-primary/15 text-primary";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
        color,
        className,
      )}
    >
      {isGroup ? `Grupo ${group}` : STAGE_LABEL[stage]}
    </span>
  );
}
