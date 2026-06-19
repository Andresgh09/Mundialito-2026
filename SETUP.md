# Mundialito — Puesta en marcha

Quiniela del Mundial 2026 entre amigos. Next.js 16 + Supabase + Tailwind v4.
Puntuación: **+3 marcador exacto**, **+1 acertar el resultado** (1-X-2).

## 1. Crear el proyecto Supabase
1. Entrá a https://supabase.com → New project (región más cercana, ej. East US).
2. En **Project Settings → API** copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key (secreta) → `SUPABASE_SERVICE_ROLE_KEY`
3. Pegalos en `.env.local` (ya tiene `SESSION_SECRET` y `JOIN_CODE` generados).

## 2. Crear las tablas
En Supabase → **SQL Editor** → New query → pegá todo `supabase/schema.sql` → Run.

## 3. Cargar equipos y fixture
```bash
pnpm seed
```
Esto carga los 48 equipos, los 12 grupos y los 72 partidos de fase de grupos,
y fija el código de grupo (`JOIN_CODE`).

> ⚠️ El sorteo en `data/world-cup-2026.json` es un **BORRADOR**. Confirmá/ajustá
> grupos, equipos y fechas contra el fixture oficial (editá el JSON y volvé a
> correr `pnpm seed`, o ajustá desde `/admin/partidos`).

## 4. Levantar en local
```bash
pnpm dev      # http://localhost:3040  (usa --webpack por la ñ del path)
```

- El **primer** usuario que se registre queda como **admin** (registrate vos primero).
- Tus amigos entran en `/registro` con el **código de grupo**, su nombre y un PIN propio.

## Flujo de uso
- **Vos (admin)**:
  - `/admin/predicciones` → cargá las predicciones pasadas de cada quien (backfill). Un botón **Guardar** manda todo junto.
  - `/admin/partidos` → cargá los resultados reales. Al guardar, **se recalculan los puntos** automáticamente.
- **Todos**: `/predicciones` para marcar los próximos partidos (se cierran 10 min antes del pitazo) y `/` para ver el ranking.

## Scripts
- `pnpm dev` · `pnpm build` · `pnpm seed`
- `node --experimental-strip-types scripts/check-scoring.ts` → test del sistema de puntos.

## Cierre antes de entregar
Correr `/cyber-neo` (audit de seguridad) una vez conectado Supabase.
