-- Migración: campos de fixture (estadio, ciudad, logos) para la sync con API-Football.
-- Correr una vez en el SQL Editor de Supabase si ya creaste las tablas antes.

alter table teams   add column if not exists logo_url text;
alter table matches add column if not exists stadium  text;
alter table matches add column if not exists city     text;
