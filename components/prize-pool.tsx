import { Trophy, Medal, Award, Coins } from "lucide-react";
import { TOTAL_POT, PLAYERS, ENTRY_FEE, PRIZES, formatCRC } from "@/lib/prizes";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const ICON = [Trophy, Medal, Award];
const TONE = ["text-primary", "text-slate-300", "text-amber-700"];

/** Tarjeta del pozo: total + reparto de premios. */
export function PrizePool() {
  return (
    <Card className="overflow-hidden border-primary/30">
      <div className="flex items-center justify-between bg-primary/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" aria-hidden />
          <span className="font-display text-lg font-bold">Pozo del Mundialito</span>
        </div>
        <span className="font-display text-2xl font-bold tabular-nums text-primary">
          {formatCRC(TOTAL_POT)}
        </span>
      </div>
      <CardContent className="pt-3">
        <p className="text-xs text-muted mb-3">
          {PLAYERS} jugadores · {formatCRC(ENTRY_FEE)} cada uno
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRIZES.map((p, i) => {
            const Icon = ICON[i];
            return (
              <div
                key={p.place}
                className="rounded-xl border border-border bg-surface px-2 py-3 text-center"
              >
                <Icon className={cn("h-5 w-5 mx-auto mb-1", TONE[i])} aria-hidden />
                <div className="font-display text-base font-bold tabular-nums">
                  {formatCRC(p.amount)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted">
                  {p.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
