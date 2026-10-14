# Decisiones (ADR-lite)

Registro de decisiones del proyecto. Una línea de estado: `DECIDIDO` / `PROPUESTA` / `REVISAR`.
Las specs citan estas decisiones; si una cambia, se actualiza aquí primero.

| # | Decisión | Estado | Fecha |
|---|---|---|---|
| D-001 | Modelo de negocio: **SaaS multi-empresa** | DECIDIDO (usuario) | 2026-09-28 |
| D-002 | Stack: **Next.js + TypeScript + shadcn/ui + PostgreSQL** | DECIDIDO (usuario acepta recomendación) | 2026-09-28 |
| D-003 | Tenancy: **DB compartida, `tenant_id` en todas las tablas + Row-Level Security en Postgres** | DECIDIDO (recomendación) | 2026-09-28 |
| D-004 | Stock negativo: **bloquear salidas que dejarían saldo < 0; corregir solo vía ajuste de inventario con motivo + permiso** | DECIDIDO (recomendación, "algo serio") | 2026-09-28 |
| D-005 | Auth: **Better Auth** con plugin de organizaciones (alternativa: Auth.js v5) | DECIDIDO (usuario OK) | 2026-09-28 |
| D-006 | ORM: **Drizzle** (SQL tipado, trabaja bien con RLS; Prisma dificulta RLS) | DECIDIDO (usuario OK) | 2026-09-28 |
| D-007 | MVP web responsive; **PWA + escaneo por cámara en fase 2** | DECIDIDO (recomendación) | 2026-09-28 |
| D-008 | Valorización: **promedio ponderado** en MVP (FIFO con lotes en fase 3) | DECIDIDO | 2026-09-28 |
| D-009 | **Jev (TypeSafe AI)** como referencia para decisiones tipadas: judge/guardrail en el flujo dev y features in-product de clasificación/anomalía | PROPUESTA (requiere early access; prototipar con OpenJev) | 2026-09-28 |

## Racional de las decisiones clave

**D-003 (tenancy).** Compartida + RLS es el estándar serio para SaaS con Postgres: el aislamiento
se garantiza en la base de datos, no en un WHERE que un desarrollador puede olvidar — elimina de
raíz la clase de bug "un tenant ve datos de otro". Alternativas descartadas: schema-per-tenant
(dolor de migraciones a escala) y DB-per-tenant (costo operativo alto para PYME). Regla derivada:
ninguna migración nueva sin `tenant_id` + política RLS desde el día uno.

**D-004 (stock negativo).** Los sistemas maduros (Odoo, ERPNext) no permiten emitir más de lo
que hay: la discrepancia se resuelve con ajuste de inventario (conteo) que deja rastro. Permitir
saldo negativo "para no frenar la venta" es la puerta al kardex mentiroso y a la pérdida de
confianza en el sistema — exactamente el problema que GSI viene a resolver. La excepción operativa
se maneja con permiso (rol) y motivo obligatorio, nunca quitando la regla.

**D-009 (Jev).** Ver `research/2026-09-28-jev.md`. En el flujo de desarrollo: juez tipado para
gates de workflows de agentes (clasificar/verificar salidas de LLM en ms y centavos). In-product:
puntos de decisión donde hoy habría un LLM generativo y sobra — autocategorizar producto por
nombre, clasificar motivo de ajuste, marcar movimiento sospechoso con score de confianza. Requiere
early access (console.typesafe.ai); prototipo con OpenJev o el adaptador System One open source.
