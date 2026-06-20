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

/** Nombre del feed (inglés) → { nombre español, bandera emoji, código ISO }.
 *  El ISO arma la URL de la imagen de bandera (flagcdn), que se ve en todos
 *  los dispositivos (los emojis de bandera no renderizan en Windows). */
export const TEAM_INFO: Record<string, { es: string; flag: string; iso: string }> = {
  Mexico: { es: "México", flag: "🇲🇽", iso: "mx" },
  "South Africa": { es: "Sudáfrica", flag: "🇿🇦", iso: "za" },
  "Korea Republic": { es: "Corea del Sur", flag: "🇰🇷", iso: "kr" },
  Czechia: { es: "Chequia", flag: "🇨🇿", iso: "cz" },
  Canada: { es: "Canadá", flag: "🇨🇦", iso: "ca" },
  "Bosnia and Herzegovina": { es: "Bosnia y Herzegovina", flag: "🇧🇦", iso: "ba" },
  Switzerland: { es: "Suiza", flag: "🇨🇭", iso: "ch" },
  Qatar: { es: "Catar", flag: "🇶🇦", iso: "qa" },
  Brazil: { es: "Brasil", flag: "🇧🇷", iso: "br" },
  Morocco: { es: "Marruecos", flag: "🇲🇦", iso: "ma" },
  Haiti: { es: "Haití", flag: "🇭🇹", iso: "ht" },
  Scotland: { es: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso: "gb-sct" },
  Australia: { es: "Australia", flag: "🇦🇺", iso: "au" },
  Paraguay: { es: "Paraguay", flag: "🇵🇾", iso: "py" },
  "Türkiye": { es: "Turquía", flag: "🇹🇷", iso: "tr" },
  USA: { es: "Estados Unidos", flag: "🇺🇸", iso: "us" },
  "Curaçao": { es: "Curazao", flag: "🇨🇼", iso: "cw" },
  "Côte d'Ivoire": { es: "Costa de Marfil", flag: "🇨🇮", iso: "ci" },
  Ecuador: { es: "Ecuador", flag: "🇪🇨", iso: "ec" },
  Germany: { es: "Alemania", flag: "🇩🇪", iso: "de" },
  Japan: { es: "Japón", flag: "🇯🇵", iso: "jp" },
  Netherlands: { es: "Países Bajos", flag: "🇳🇱", iso: "nl" },
  Sweden: { es: "Suecia", flag: "🇸🇪", iso: "se" },
  Tunisia: { es: "Túnez", flag: "🇹🇳", iso: "tn" },
  Belgium: { es: "Bélgica", flag: "🇧🇪", iso: "be" },
  Egypt: { es: "Egipto", flag: "🇪🇬", iso: "eg" },
  "IR Iran": { es: "Irán", flag: "🇮🇷", iso: "ir" },
  "New Zealand": { es: "Nueva Zelanda", flag: "🇳🇿", iso: "nz" },
  "Cabo Verde": { es: "Cabo Verde", flag: "🇨🇻", iso: "cv" },
  "Saudi Arabia": { es: "Arabia Saudita", flag: "🇸🇦", iso: "sa" },
  Spain: { es: "España", flag: "🇪🇸", iso: "es" },
  Uruguay: { es: "Uruguay", flag: "🇺🇾", iso: "uy" },
  France: { es: "Francia", flag: "🇫🇷", iso: "fr" },
  Iraq: { es: "Irak", flag: "🇮🇶", iso: "iq" },
  Norway: { es: "Noruega", flag: "🇳🇴", iso: "no" },
  Senegal: { es: "Senegal", flag: "🇸🇳", iso: "sn" },
  Algeria: { es: "Argelia", flag: "🇩🇿", iso: "dz" },
  Argentina: { es: "Argentina", flag: "🇦🇷", iso: "ar" },
  Austria: { es: "Austria", flag: "🇦🇹", iso: "at" },
  Jordan: { es: "Jordania", flag: "🇯🇴", iso: "jo" },
  Colombia: { es: "Colombia", flag: "🇨🇴", iso: "co" },
  "Congo DR": { es: "RD Congo", flag: "🇨🇩", iso: "cd" },
  Portugal: { es: "Portugal", flag: "🇵🇹", iso: "pt" },
  Uzbekistan: { es: "Uzbekistán", flag: "🇺🇿", iso: "uz" },
  Croatia: { es: "Croacia", flag: "🇭🇷", iso: "hr" },
  England: { es: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso: "gb-eng" },
  Ghana: { es: "Ghana", flag: "🇬🇭", iso: "gh" },
  Panama: { es: "Panamá", flag: "🇵🇦", iso: "pa" },
};

/** URL de imagen de bandera (flagcdn) a partir del ISO. */
export function flagUrl(iso: string): string {
  return `https://flagcdn.com/w80/${iso}.png`;
}

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
