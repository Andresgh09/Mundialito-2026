import Link from "next/link";
import { TrendingDown } from "lucide-react";
import type { LeaderRow } from "@/lib/queries";
import { cn } from "@/lib/cn";

/** "El colero" — destaca al último lugar de forma divertida (mufa). */
export function LoserCard({
  row,
  currentUserId,
}: {
  row: LeaderRow;
  currentUserId?: string;
}) {
  const isMe = row.user_id === currentUserId;
  return (
    <section>
      <h2 className="font-display text-sm uppercase tracking-wide text-muted mb-2">
        🧤 La mufa del Mundialito
      </h2>
      <Link
        href={`/perfil/${row.user_id}`}
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius)] border border-danger/40 bg-danger/10 p-3 transition-colors cursor-pointer hover:bg-danger/15",
          isMe && "ring-2 ring-danger/60",
        )}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/20 text-danger">
          <TrendingDown className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">
            {row.name}
            {isMe && <span className="text-danger text-xs ml-1">(vos 😬)</span>}
          </p>
          <p className="text-xs text-muted">
            Último lugar · ¡pura mufa! A ver si remontás 🐢
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="font-display text-2xl font-bold tabular-nums text-danger">
            {row.points}
          </span>
          <span className="block text-[10px] uppercase tracking-wide text-muted">
            pts
          </span>
        </span>
      </Link>
    </section>
  );
}
