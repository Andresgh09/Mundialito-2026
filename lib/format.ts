const fmt = new Intl.DateTimeFormat("es-CR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Costa_Rica",
});

const fmtShort = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Costa_Rica",
});

/** "lun, 18 jun, 11:00" */
export function formatKickoff(iso: string): string {
  return fmt.format(new Date(iso));
}

export function formatKickoffShort(iso: string): string {
  return fmtShort.format(new Date(iso));
}
