import type { Stage } from "./types";

/**
 * Fuente del fixture: fixturedownload.com (gratis, sin API key, sin cap).
 * Trae los 104 partidos del Mundial 2026 con fecha UTC, estadio, grupo,
 * equipos y marcadores (los marcadores se van llenando con el torneo).
 */
export const FEED_URL = "https://fixturedownload.com/feed/json/fifa-world-cup-2026";

export interface FeedMatch {
  MatchNumber: number;
  RoundNumber: number;
  DateUtc: string; // "2026-06-11 19:00:00Z"
  Location: string; // "Mexico City Stadium"
  HomeTeam: string;
  AwayTeam: string;
  Group: string | null; // "Group A" | null en eliminatorias
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  Winner: string | null;
}

/** Nombre del feed (inglés) → { nombre en español, bandera }. */
export const TEAM_INFO: Record<string, { es: string; flag: string }> = {
  Mexico: { es: "México", flag: "🇲🇽" },
  "South Africa": { es: "Sudáfrica", flag: "🇿🇦" },
  "Korea Republic": { es: "Corea del Sur", flag: "🇰🇷" },
  Czechia: { es: "Chequia", flag: "🇨🇿" },
  Canada: { es: "Canadá", flag: "🇨🇦" },
  "Bosnia and Herzegovina": { es: "Bosnia y Herzegovina", flag: "🇧🇦" },
  Switzerland: { es: "Suiza", flag: "🇨🇭" },
  Qatar: { es: "Catar", flag: "🇶🇦" },
  Brazil: { es: "Brasil", flag: "🇧🇷" },
  Morocco: { es: "Marruecos", flag: "🇲🇦" },
  Haiti: { es: "Haití", flag: "🇭🇹" },
  Scotland: { es: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  Australia: { es: "Australia", flag: "🇦🇺" },
  Paraguay: { es: "Paraguay", flag: "🇵🇾" },
  "Türkiye": { es: "Turquía", flag: "🇹🇷" },
  USA: { es: "Estados Unidos", flag: "🇺🇸" },
  "Curaçao": { es: "Curazao", flag: "🇨🇼" },
  "Côte d'Ivoire": { es: "Costa de Marfil", flag: "🇨🇮" },
  Ecuador: { es: "Ecuador", flag: "🇪🇨" },
  Germany: { es: "Alemania", flag: "🇩🇪" },
  Japan: { es: "Japón", flag: "🇯🇵" },
  Netherlands: { es: "Países Bajos", flag: "🇳🇱" },
  Sweden: { es: "Suecia", flag: "🇸🇪" },
  Tunisia: { es: "Túnez", flag: "🇹🇳" },
  Belgium: { es: "Bélgica", flag: "🇧🇪" },
  Egypt: { es: "Egipto", flag: "🇪🇬" },
  "IR Iran": { es: "Irán", flag: "🇮🇷" },
  "New Zealand": { es: "Nueva Zelanda", flag: "🇳🇿" },
  "Cabo Verde": { es: "Cabo Verde", flag: "🇨🇻" },
  "Saudi Arabia": { es: "Arabia Saudita", flag: "🇸🇦" },
  Spain: { es: "España", flag: "🇪🇸" },
  Uruguay: { es: "Uruguay", flag: "🇺🇾" },
  France: { es: "Francia", flag: "🇫🇷" },
  Iraq: { es: "Irak", flag: "🇮🇶" },
  Norway: { es: "Noruega", flag: "🇳🇴" },
  Senegal: { es: "Senegal", flag: "🇸🇳" },
  Algeria: { es: "Argelia", flag: "🇩🇿" },
  Argentina: { es: "Argentina", flag: "🇦🇷" },
  Austria: { es: "Austria", flag: "🇦🇹" },
  Jordan: { es: "Jordania", flag: "🇯🇴" },
  Colombia: { es: "Colombia", flag: "🇨🇴" },
  "Congo DR": { es: "RD Congo", flag: "🇨🇩" },
  Portugal: { es: "Portugal", flag: "🇵🇹" },
  Uzbekistan: { es: "Uzbekistán", flag: "🇺🇿" },
  Croatia: { es: "Croacia", flag: "🇭🇷" },
  England: { es: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  Ghana: { es: "Ghana", flag: "🇬🇭" },
  Panama: { es: "Panamá", flag: "🇵🇦" },
};

export async function fetchFeed(): Promise<FeedMatch[]> {
  const res = await fetch(FEED_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Feed respondió ${res.status}`);
  return (await res.json()) as FeedMatch[];
}

export function isGroupTeam(name: string): boolean {
  return name in TEAM_INFO;
}

/** "Group A" → "A"; null en eliminatorias. */
export function groupLetter(group: string | null): string | null {
  if (!group) return null;
  const m = group.match(/group\s+([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

/** RoundNumber del feed → etapa nuestra. maxMatch decide final vs 3er lugar. */
export function stageFromRound(round: number, matchNumber: number, maxMatch: number): Stage {
  if (round <= 3) return "group";
  if (round === 4) return "r32";
  if (round === 5) return "r16";
  if (round === 6) return "qf";
  if (round === 7) return "sf";
  // round 8: el último partido del torneo es la final; el otro, 3er lugar.
  return matchNumber === maxMatch ? "final" : "third";
}

/** "2026-06-11 19:00:00Z" → ISO válido. */
export function toIso(dateUtc: string): string {
  return dateUtc.replace(" ", "T");
}

/** "Mexico City Stadium" → "Mexico City". */
export function cityFromLocation(loc: string): string | null {
  const c = loc.replace(/\s*Stadium$/i, "").trim();
  return c.length && c !== loc ? c : null;
}

/** Etiqueta de equipo por definir en eliminatorias ("2A", "1E"...) o null. */
export function knockoutLabel(name: string): string | null {
  if (!name || /to be announced/i.test(name)) return null;
  if (name in TEAM_INFO) return null; // ya es un equipo real
  return name;
}
