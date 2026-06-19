# Mundialito — Puesta en marcha

Quiniela del Mundial 2026 entre amigos. Next.js 16 + Supabase + Tailwind v4.
Puntuación: **+3 marcador exacto**, **+1 acertar el resultado** (1-X-2).

## Variables de entorno (.env.local)
Copiá `.env.example` a `.env.local` y completá:
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API)
- `SESSION_SECRET` (cadena aleatoria ≥16), `JOIN_CODE` (código para registrarse)
- `CRON_SECRET` (protege el GET de `/api/sync`)

## Base de datos (Supabase)
1. SQL Editor → correr `supabase/schema.sql` (tablas + GRANT a service_role).
2. Si actualizás desde una versión vieja, correr `supabase/02-fixture-fields.sql`.

## Fixture y resultados (fuente gratuita)
El fixture sale de **fixturedownload.com** (gratis, sin API key): 104 partidos
con estadio, grupo, fecha y marcadores. La carga/actualización es **manual**:
- En la app: panel **/admin → "Actualizar fixture y resultados"** (solo admin).
- O por HTTP: `GET /api/sync` con header `Authorization: Bearer <CRON_SECRET>`.

Trae nombres en español + banderas, marca los partidos jugados con su marcador
y **recalcula los puntos** automáticamente. Volvé a tocarlo cuando haya
resultados nuevos.

## Local
```bash
pnpm dev      # http://localhost:3040  (usa --webpack por la ñ del path)
```
El **primer** usuario que se registra queda **admin** (registrate vos primero).
Tus amigos entran en `/registro` con el código de grupo, su nombre y un PIN.

## Producción (Vercel)
- Repo conectado a Vercel; cada push a `main` despliega.
- Cargar en Vercel las mismas variables de entorno (Production).
- Para actualizar resultados: entrar como admin y tocar el botón, o pegarle al
  endpoint `/api/sync` con el `CRON_SECRET`.

## Pozo de premios
14 jugadores × ₡10.000 = ₡140.000 · 1º ₡100k / 2º ₡30k / 3º ₡10k.
Editable en `lib/prizes.ts`.

## Cierre antes de entregar
Correr `/cyber-neo` (audit de seguridad) — hay dinero real en juego.
