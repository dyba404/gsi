# GSI — SaaS de gestión de stock multi-empresa

SaaS de inventario para PYMEs latam que hoy operan en planilla de Excel: una fuente de
verdad de qué hay, dónde, cuánto y a qué costo, con kardex trazable por movimiento.
Multi-empresa desde el día uno: aislamiento por `tenant_id` + **Row-Level Security real
en Postgres**. La competencia real es el Excel, no Odoo.

## Características

- **Kardex append-only**: todo cambio de stock es un movimiento trazable; el saldo nunca
  se edita a mano.
- **Salidas bloqueadas** si dejarían saldo negativo; la corrección solo por ajuste con
  motivo obligatorio.
- **Valorización por promedio ponderado**.
- **Multi-tenant con RLS en runtime**: la app corre con un rol restringido (`app_conn`)
  distinto del rol de migraciones (`app_owner`) — el aislamiento lo garantiza Postgres,
  no el código de la app.
- **Roles por tenant** en MVP: administrador (dueño), encargado de almacén y
  vendedor/cajero.
- Auth con organizaciones (Better Auth).
- Tests unitarios (inventario, aislamiento RLS, roles) + E2E con Playwright.
- Auditorías de RLS: `npm run check:rls` (estático) y `npm run check:rls-runtime` (en vivo).

## Stack

Next.js 16 (App Router) · TypeScript · Drizzle ORM · PostgreSQL 16 con RLS ·
Better Auth (organizaciones) · shadcn/ui · Tailwind 4 · Zod · Vitest + Playwright ·
Docker Compose.

## Setup

```bash
docker compose up -d        # Postgres 16 + roles e init.sql
cp .env.example .env        # dos conexiones: app_owner (migraciones) y app_conn (runtime)
npm install
npm run db:migrate
npm run dev                 # http://localhost:3000
```

## Estructura

```
app/          → Next.js 16: páginas + API
components/   → UI (shadcn/ui)
db/           → schema Drizzle multi-tenant
drizzle/      → migraciones (0001: seguridad RLS)
lib/          → dominio del inventario (kardex, saldos, ajustes, errores de dominio)
tests/        → vitest: inventario, rls-isolation, roles
tests/e2e/    → Playwright: auth, inventario
scripts/      → auditoría RLS (check-rls.mjs, rls-runtime-check.ts)
docs/         → dominio, decisiones (D-001..D-009), features de referencia
docker/       → init.sql (roles app_owner / app_conn)
```

## Estado

Fundación completa: auth con organizaciones, multi-tenant con RLS verificado en runtime
y roles por tenant. Núcleo de stock (kardex y valorización) en construcción. Decisiones
de producto cerradas y registradas con su racional en `PRODUCT.md` y `docs/decisiones.md`.
