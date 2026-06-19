import { MapPin } from "lucide-react";

/** Línea compacta de estadio · ciudad (no renderiza nada si falta el dato). */
export function Venue({
  stadium,
  city,
  className = "",
}: {
  stadium: string | null;
  city: string | null;
  className?: string;
}) {
  if (!stadium && !city) return null;
  return (
    <span className={`flex items-center gap-1 text-xs text-muted min-w-0 ${className}`}>
      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">
        {stadium}
        {stadium && city ? " · " : ""}
        {city}
      </span>
    </span>
  );
}
