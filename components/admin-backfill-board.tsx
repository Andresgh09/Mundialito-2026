"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Save, UserRound } from "lucide-react";
import type { MatchWithTeams, Profile } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/types";
import { formatKickoffShort } from "@/lib/format";
import { saveBackfill } from "@/app/actions/admin";
import { TeamBadge } from "@/components/team-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Score = { home: string; away: string };
type ByUser = Record<string, Record<number, { home: number; away: number }>>;

function Cell({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <input
      aria-label={label}
      inputMode="numeric"
      maxLength={2}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
      placeholder="-"
      className="h-11 w-11 rounded-xl border border-border bg-surface text-center text-lg font-bold tabular-nums text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

export function AdminBackfillBoard({
  profiles,
  matches,
  byUser,
}: {
  profiles: Profile[];
  matches: MatchWithTeams[];
  byUser: ByUser;
}) {
  const [userId, setUserId] = React.useState(profiles[0]?.id ?? "");
  const [scores, setScores] = React.useState<Record<number, Score>>({});
  const [pending, startTransition] = React.useTransition();
  const [toast, setToast] = React.useState<string | null>(null);

  // Cargar las predicciones existentes del usuario seleccionado.
  React.useEffect(() => {
    const existing = byUser[userId] ?? {};
    const s: Record<number, Score> = {};
    for (const m of matches) {
      const e = existing[m.id];
      s[m.id] = { home: e ? String(e.home) : "", away: e ? String(e.away) : "" };
    }
    setScores(s);
  }, [userId, matches, byUser]);

  const set = (id: number, side: "home" | "away", v: string) =>
    setScores((prev) => ({ ...prev, [id]: { ...prev[id], [side]: v } }));

  const dirty = React.useMemo(() => {
    const existing = byUser[userId] ?? {};
    const rows: { user_id: string; match_id: number; home: number; away: number }[] = [];
    for (const m of matches) {
      const cur = scores[m.id];
      if (!cur || cur.home === "" || cur.away === "") continue;
      const home = Number(cur.home);
      const away = Number(cur.away);
      const prev = existing[m.id];
      if (!prev || prev.home !== home || prev.away !== away) {
        rows.push({ user_id: userId, match_id: m.id, home, away });
      }
    }
    return rows;
  }, [matches, scores, byUser, userId]);

  function onSave() {
    startTransition(async () => {
      const res = await saveBackfill(dirty);
      setToast(res.ok ? `Guardado: ${res.saved} predicción(es).` : res.error ?? "Error");
      setTimeout(() => setToast(null), 3500);
    });
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Selector de jugador */}
      <div className="sticky top-14 z-10 -mx-4 px-4 py-2 bg-background/90 backdrop-blur border-b border-border">
        <label className="flex items-center gap-2 text-sm">
          <UserRound className="h-4 w-4 text-muted" aria-hidden />
          <span className="text-muted">Jugador:</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 h-10 rounded-[var(--radius)] border border-border bg-surface px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {matches.map((m) => {
        const cur = scores[m.id] ?? { home: "", away: "" };
        return (
          <div key={m.id} className="rounded-[var(--radius)] border border-border bg-card p-3">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>
                {m.stage === "group" && m.group_letter
                  ? `Grupo ${m.group_letter}`
                  : STAGE_LABEL[m.stage]}
                {m.status === "finished" && (
                  <span className="ml-2 text-accent">
                    real {m.home_score}-{m.away_score}
                  </span>
                )}
              </span>
              <span>{formatKickoffShort(m.kickoff_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TeamBadge team={m.home_team} className="flex-1" />
              <div className="flex items-center gap-1.5 shrink-0">
                <Cell label={`Goles ${m.home_team?.name}`} value={cur.home} onChange={(v) => set(m.id, "home", v)} />
                <span className="text-muted font-bold">·</span>
                <Cell label={`Goles ${m.away_team?.name}`} value={cur.away} onChange={(v) => set(m.id, "away", v)} />
              </div>
              <TeamBadge team={m.away_team} align="right" className="flex-1" />
            </div>
          </div>
        );
      })}

      <AnimatePresence>
        {(dirty.length > 0 || toast) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 bottom-[64px] z-20 px-4"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-elevated/95 backdrop-blur px-4 py-3 shadow-lg">
              <span className={cn("text-sm", toast ? "text-accent" : "text-muted")}>
                {toast ?? `${dirty.length} cambio(s) sin guardar`}
              </span>
              <Button onClick={onSave} disabled={dirty.length === 0 || pending} size="sm">
                <Save className="h-4 w-4" aria-hidden />
                {pending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
