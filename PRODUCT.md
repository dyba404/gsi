# Product — GSI

<!-- impeccable:product-schema 1 -->
<!-- Decisiones cerradas el 2026-09-28 con el usuario. Registro completo y racionales en docs/decisiones.md.
     Features de referencia (qué ya está resuelto en el mercado) en docs/features-referencia.md. -->

## Platform

web responsive (MVP). PWA con escaneo por cámara para almacén en fase 2 (D-007).

## Stack

Next.js + TypeScript + shadcn/ui + PostgreSQL (D-002, confirmado por el usuario). Auth: Better
Auth con organizaciones (D-005, propuesta). ORM: Drizzle (D-006, propuesta). Decidido como SaaS
multi-empresa (D-001): aislamiento por `tenant_id` + Row-Level Security en Postgres (D-003).

## Users

Por tenant (empresa cliente), 3 roles en MVP:
- **Administrador (dueño):** dashboard (valor de stock, quiebres, reposición), reportes, configuración. No opera el almacén a diario; el número del sistema tiene que ser confiable a primera vista.
- **Encargado de almacén:** recibe compras, conteos, ajustes y traspasos; trabaja con las manos ocupadas y con prisa. Velocidad y trazabilidad antes que todo.
- **Vendedor/Cajero:** consulta stock antes de vender y registra salidas; no puede vender lo que no hay (D-004).

Más: **Superadmin de la plataforma** (console interno para soporte y métricas de tenants) en fase 2.

## Product Purpose

SaaS de gestión de stock/inventario multi-empresa: una fuente de verdad de qué hay, dónde, cuánto y a qué costo, con kardex trazable por movimiento. Existe porque las planillas Excel se desincronizan y los ERPs completos son demasiado para una PYME. Éxito: que el stock mostrado coincida con el físico (conteo cíclico sin sorpresas) y que nadie venda sin stock.

## Positioning

Inventario en español para PYMEs latam que hoy operan en planilla: sin módulos que nadie usa, mobile-first para almacén, a precio de barrio. La competencia real es el Excel, no Odoo. Mecanismos difíciles de copiar: kardex auditable visible para el dueño + onboarding importando la planilla que ya usan + decisiones tipadas con score de confianza (Jev, D-009) en clasificación y anomalías.

## Operating Context

- Operación real de almacén: prisa, una mano ocupada, prisa de caja → targets grandes, búsqueda instantánea, estados visibles de un vistazo, badges con color y texto.
- Reglas del dominio que no se rompen (`docs/dominio.md`): todo cambio de stock es un movimiento append-only; el saldo nunca se edita a mano; salidas bloqueadas si dejarían saldo negativo, corrección solo por ajuste con motivo (D-004).
- Valorización promedio ponderado en MVP (D-008); lotes/FIFO en fase 3.
- Fases: MVP (núcleo stock) → F2 (compras, conteo cíclico, reportes, billing) → F3 (multi-almacén, lotes, POS, API).
