"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Save, CheckCircle2, Clock } from "lucide-react";
import type { MatchWithTeams } from "@/lib/types";
import { StageBadge } from "@/components/stage-badge";
import { formatKickoff } from "@/lib/format";
import { savePredictions, type SaveResult } from "@/app/actions/predictions";
import { TeamBadge } from "@/components/team-badge";
import { Venue } from "@/components/venue";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Score = { home: string; away: string };
type Initial = Record<number, { home: number; away: number } | undefined>;

function ScoreCell({
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
      pattern="\d*"
      maxLength={2}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
      placeholder="-"
      className="h-12 w-12 rounded-xl border border-border bg-surface text-center text-xl font-bold tabular-nums text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
    />
  );
}

export function PredictionBoard({
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
      s[m.id] = {
        home: init ? String(init.home) : "",
        away: init ? String(init.away) : "",
      };
    }
    return s;
  });
  const [saved, setSaved] = React.useState<Initial>(initial);
  const [pending, startTransition] = React.useTransition();
  const [toast, setToast] = React.useState<string | null>(null);

  const set = (id: number, side: "home" | "away", v: string) =>
    setScores((prev) => ({ ...prev, [id]: { ...prev[id], [side]: v } }));

  const dirtyRows = React.useMemo(() => {
    const rows: { match_id: number; home: number; away: number }[] = [];
    for (const m of matches) {
      const cur = scores[m.id];
      if (!cur || cur.home === "" || cur.away === "") continue;
      const home = Number(cur.home);
      const away = Number(cur.away);
      const prev = saved[m.id];
      if (!prev || prev.home !== home || prev.away !== away) {
        rows.push({ match_id: m.id, home, away });
      }
    }
    return rows;
  }, [matches, scores, saved]);

  const hasChanges = dirtyRows.length > 0;

  function onSave() {
    startTransition(async () => {
      const res: SaveResult = await savePredictions(dirtyRows);
      if (res.ok) {
        setSaved((prev) => {
          const next = { ...prev };
          for (const r of dirtyRows) next[r.match_id] = { home: r.home, away: r.away };
          return next;
        });
        setToast(
          res.skipped > 0
            ? `Guardado. ${res.skipped} partido(s) ya estaban cerrados.`
            : "¡Predicciones guardadas!",
        );
      } else {
        setToast(res.error ?? "No se pudo guardar");
      }
      setTimeout(() => setToast(null), 3500);
    });
  }

  // Agrupar por día
  const groups = React.useMemo(() => {
    const map = new Map<string, MatchWithTeams[]>();
    for (const m of matches) {
      const day = formatKickoff(m.kickoff_at).split(",").slice(0, 2).join(",");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return [...map.entries()];
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <Clock className="h-8 w-8 mx-auto mb-3 opacity-60" aria-hidden />
        No hay partidos abiertos para predecir ahora mismo.
        <br />
        Volvé pronto: las predicciones se abren hasta 10 min antes de cada partido.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {groups.map(([day, dayMatches]) => (
        <section key={day}>
          <h2 className="font-display text-sm uppercase tracking-wide text-muted mb-2">
            {day}
          </h2>
          <div className="space-y-2">
            {dayMatches.map((m) => {
              const cur = scores[m.id];
              const isSaved =
                saved[m.id] &&
                cur.home === String(saved[m.id]!.home) &&
                cur.away === String(saved[m.id]!.away) &&
                cur.home !== "";
              return (
                <div
                  key={m.id}
                  className="rounded-[var(--radius)] border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between text-xs text-muted mb-2">
                    <StageBadge stage={m.stage} group={m.group_letter} />
                    <span className="flex items-center gap-1">
                      {isSaved && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden />
                      )}
                      {formatKickoff(m.kickoff_at)}
                    </span>
                  </div>
                  <Venue stadium={m.stadium} city={m.city} className="mb-2" />
                  <div className="flex items-center gap-2">
                    <TeamBadge team={m.home_team} className="flex-1" />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ScoreCell
                        label={`Goles ${m.home_team?.name ?? "local"}`}
                        value={cur?.home ?? ""}
                        onChange={(v) => set(m.id, "home", v)}
                      />
                      <span className="text-muted font-bold">·</span>
                      <ScoreCell
                        label={`Goles ${m.away_team?.name ?? "visitante"}`}
                        value={cur?.away ?? ""}
                        onChange={(v) => set(m.id, "away", v)}
                      />
                    </div>
                    <TeamBadge team={m.away_team} align="right" className="flex-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Barra de guardado por lote */}
      <AnimatePresence>
        {(hasChanges || toast) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 bottom-[64px] z-20 px-4"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-elevated/95 backdrop-blur px-4 py-3 shadow-lg">
              <span className={cn("text-sm", toast ? "text-accent" : "text-muted")}>
                {toast ??
                  `${dirtyRows.length} cambio${dirtyRows.length === 1 ? "" : "s"} sin guardar`}
              </span>
              <Button onClick={onSave} disabled={!hasChanges || pending} size="sm">
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
