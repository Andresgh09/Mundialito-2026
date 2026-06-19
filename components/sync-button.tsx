"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dispara POST /api/sync (solo admin) y muestra el resumen. */
export function SyncButton() {
  const [pending, setPending] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg(
          `✓ ${data.teams} equipos, ${data.matches} partidos, ${data.finished} jugados, ${data.recomputed} predicciones puntuadas.`,
        );
        // refrescar datos del server
        window.location.reload();
      } else {
        setMsg(`✗ ${data.error ?? "Error al sincronizar"}`);
      }
    } catch {
      setMsg("✗ No se pudo conectar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={pending} variant="accent" className="w-full">
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
        {pending ? "Actualizando…" : "Actualizar fixture y resultados"}
      </Button>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </div>
  );
}
