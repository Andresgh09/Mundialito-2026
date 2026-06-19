-- Migración: campos de fixture (estadio, ciudad, etiquetas de eliminatoria).
-- Correr una vez en el SQL Editor de Supabase si ya creaste las tablas antes.

alter table teams   add column if not exists logo_url   text;
alter table matches add column if not exists stadium    text;
alter table matches add column if not exists city       text;
alter table matches add column if not exists home_label text;
alter table matches add column if not exists away_label text;
