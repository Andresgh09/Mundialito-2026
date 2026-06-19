"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/** Input de PIN de 4 dígitos, numérico, mobile-friendly (teclado numérico). */
export function PinInput({
  name,
  label,
  autoFocus,
}: {
  name: string;
  label: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = React.useState("");
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-muted mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="••••"
        className={cn(
          "h-14 w-full rounded-[var(--radius)] border border-border bg-surface text-center text-2xl tracking-[0.6em] font-semibold text-foreground placeholder:text-muted placeholder:tracking-[0.4em]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
        )}
      />
    </div>
  );
}
