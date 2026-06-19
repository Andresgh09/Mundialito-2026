"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Crown, Target, Check } from "lucide-react";
import type { LeaderRow } from "@/lib/queries";
import { prizeForRank, formatCRC } from "@/lib/prizes";
import { cn } from "@/lib/cn";

const MEDAL = ["text-primary", "text-slate-300", "text-amber-700"];

export function Leaderboard({
  rows,
  currentUserId,
}: {
  rows: LeaderRow[];
  currentUserId?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-muted py-12">
        Todavía no hay jugadores. Sé el primero en{" "}
        <Link href="/registro" className="text-primary font-semibold">
          unirte
        </Link>
        .
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {rows.map((row, i) => {
        const rank = i + 1;
        const isMe = row.user_id === currentUserId;
        const prize = prizeForRank(rank);
        return (
          <motion.li
            key={row.user_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
          >
            <Link
              href={`/perfil/${row.user_id}`}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] border p-3 transition-colors cursor-pointer",
                isMe
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card hover:bg-elevated",
              )}
            >
              <span className="w-7 shrink-0 text-center font-display text-lg font-bold tabular-nums">
                {rank <= 3 ? (
                  <Crown className={cn("h-5 w-5 mx-auto", MEDAL[rank - 1])} aria-hidden />
                ) : (
                  <span className="text-muted">{rank}</span>
                )}
              </span>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-elevated text-sm font-bold text-primary">
                {row.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">
                  {row.name}
                  {isMe && <span className="text-primary text-xs ml-1">(vos)</span>}
                </p>
                <p className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" aria-hidden /> {row.exact} exactos
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" aria-hidden /> {row.result} resultados
                  </span>
                </p>
                {prize != null && (
                  <span className="mt-1 inline-block rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-bold text-primary tabular-nums">
                    {formatCRC(prize)}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-right">
                <span className="font-display text-2xl font-bold tabular-nums text-primary">
                  {row.points}
                </span>
                <span className="block text-[10px] uppercase tracking-wide text-muted">
                  pts
                </span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </ol>
  );
}
