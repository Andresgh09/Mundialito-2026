export type Stage =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final";

export type MatchStatus = "scheduled" | "finished";

export interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  flag_emoji: string;
  group_letter: string | null;
}

export interface Match {
  id: number;
  stage: Stage;
  group_letter: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: number;
  home_pred: number;
  away_pred: number;
  points: number | null;
  updated_at: string;
}

/** Match con los equipos ya unidos (join), para render. */
export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
}

export const STAGE_LABEL: Record<Stage, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinal",
  third: "Tercer lugar",
  final: "Final",
};
