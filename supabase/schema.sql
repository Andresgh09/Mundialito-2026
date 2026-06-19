-- Mundialito · esquema Postgres (Supabase)
-- Ejecutar en el SQL Editor de Supabase, o vía `psql`.
-- El acceso desde la app es siempre con service-role (salta RLS); RLS queda
-- activado sin políticas como defensa en profundidad contra el cliente anon.

create extension if not exists pgcrypto;

-- Perfiles de usuario (auth custom con PIN hasheado) ------------------------
create table if not exists profiles (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  pin_hash     text not null,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Equipos -------------------------------------------------------------------
create table if not exists teams (
  id           integer primary key,
  name         text not null,
  code         text not null,
  flag_emoji   text not null default '',
  group_letter text
);

-- Partidos ------------------------------------------------------------------
create table if not exists matches (
  id           integer primary key,
  stage        text not null check (stage in ('group','r32','r16','qf','sf','third','final')),
  group_letter text,
  home_team_id integer references teams(id),
  away_team_id integer references teams(id),
  kickoff_at   timestamptz not null,
  home_score   integer,
  away_score   integer,
  status       text not null default 'scheduled' check (status in ('scheduled','finished'))
);
create index if not exists matches_kickoff_idx on matches (kickoff_at);

-- Predicciones --------------------------------------------------------------
create table if not exists predictions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  match_id   integer not null references matches(id) on delete cascade,
  home_pred  integer not null check (home_pred >= 0 and home_pred <= 99),
  away_pred  integer not null check (away_pred >= 0 and away_pred <= 99),
  points     integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);
create index if not exists predictions_match_idx on predictions (match_id);
create index if not exists predictions_user_idx  on predictions (user_id);

-- Config clave/valor (ej. join_code) ---------------------------------------
create table if not exists app_config (
  key   text primary key,
  value text not null
);

-- RLS: activar y NO crear políticas (anon/public quedan sin acceso) ---------
alter table profiles    enable row level security;
alter table teams       enable row level security;
alter table matches     enable row level security;
alter table predictions enable row level security;
alter table app_config  enable row level security;
