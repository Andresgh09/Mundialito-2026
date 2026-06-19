"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Save } from "lucide-react";
import type { MatchWithTeams } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/types";
import { formatKickoffShort } from "@/lib/format";
import { setMatchResults } from "@/app/actions/admin";
import { TeamBadge } from "@/components/team-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Score = { home: string; away: string };
type Initial = Record<number, { home: number; away: number } | null>;

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

export function AdminResultsBoard({
  matches,
  initial,
}: {
  matches: MatchWithTeams[];
  initial: Initial;
}) {
  const [scores, setScores] = React.useState<Record<number, Score>>(() => {
    const s: Record<number, Score> = {};
    for (const m of matches) {
      const init = initial[m.id];
      s[m.id] = { home: init ? String(init.home) : "", away: init ? String(init.away) : "" };
    }
    return s;
  });
  const [saved, setSaved] = React.useState<Initial>(initial);
  const [pending, startTransition] = React.useTransition();
  const [toast, setToast] = React.useState<string | null>(null);

  const set = (id: number, side: "home" | "away", v: string) =>
    setScores((prev) => ({ ...prev, [id]: { ...prev[id], [side]: v } }));

  const dirty = React.useMemo(() => {
    const rows: { matchId: number; home: number | null; away: number | null }[] = [];
    for (const m of matches) {
      const cur = scores[m.id];
      const bothFilled = cur.home !== "" && cur.away !== "";
      const bothEmpty = cur.home === "" && cur.away === "";
      if (!bothFilled && !bothEmpty) continue; // incompleto: ignorar
      const prev = saved[m.id];
      if (bothEmpty) {
        if (prev != null) rows.push({ matchId: m.id, home: null, away: null });
      } else {
        const home = Number(cur.home);
        const away = Number(cur.away);
        if (!prev || prev.home !== home || prev.away !== away) {
          rows.push({ matchId: m.id, home, away });
        }
      }
    }
    return rows;
  }, [matches, scores, saved]);

  function onSave() {
    startTransition(async () => {
      const res = await setMatchResults(dirty);
      if (res.ok) {
        setSaved((prev) => {
          const next = { ...prev };
          for (const r of dirty)
            next[r.matchId] = r.home == null ? null : { home: r.home, away: r.away! };
          return next;
        });
        setToast(`Guardado: ${res.saved} partido(s). Puntos recalculados.`);
      } else {
        setToast(res.error ?? "Error al guardar");
      }
      setTimeout(() => setToast(null), 3500);
    });
  }

  return (
    <div className="space-y-2 pb-4">
      {matches.map((m) => {
        const cur = scores[m.id];
        return (
          <div key={m.id} className="rounded-[var(--radius)] border border-border bg-card p-3">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>
                {m.stage === "group" && m.group_letter
                  ? `Grupo ${m.group_letter}`
                  : STAGE_LABEL[m.stage]}
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
                {toast ?? `${dirty.length} resultado(s) sin guardar`}
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
