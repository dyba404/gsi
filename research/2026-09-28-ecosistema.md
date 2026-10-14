# Research — Ecosistema para armar GSI con IA (2026-09-28)

Investigación del día de armado del kit. Fuentes al final.

## 1. SDD (spec-driven development) — qué existe y qué elegir

| Herramienta | Qué es | Cuándo sirve para GSI |
|---|---|---|
| **GitHub Spec Kit** (`github/spec-kit`, MIT, ~92k stars, v0.8+ en 2026) | CLI `specify` + comandos /speckit.*; flujo Specify → Plan → Tasks → Implement | El más completo; vale migrar specs de `specs/` si el proyecto crece |
| **OpenSpec** | Ligero, specs versionadas junto al diff | La mejor nota en comparativa 2026 (4.00 vs Spec Kit 3.74, BMAD 3.65); ideal si el tooling pesa |
| **Kiro** (AWS) | IDE spec-driven nativo | Solo si se cambia de editor |
| **BMAD Method** | Framework de roles/agentes | Overkill para un solo dev + IA |

**Decisión tomada:** SDD artesanal en `specs/` (README + plantillas + spec 001). Compatible
conceptualmente con los tres; migrar luego es copiar contenido.

## 2. Skills de IA — repos donde seguir abasteciendo el kit

- **[ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)** — la lista curada más grande (skills, recursos, herramientas).
- **[travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)** — otra lista popular, actualizada.
- **[anthropics/claude-code → frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)** — la skill oficial anti-"AI slop"; de hecho es una de las fuentes que citan `hallmark`/`impeccable` (ya traídas).
- **[aitmpl.com/skills](https://www.aitmpl.com/skills)** — plantillas de skills listas (incl. frontend React/Next/Tailwind).
- Roundups útiles: "Top 8 Claude Skills for UI/UX Engineers" (Snyk), "14 Best Claude Code Skills" ([firecrawl](https://www.firecrawl.dev/blog/best-claude-code-skills)).

**Estado local:** 18 skills de diseño traídas desde `../UX/.opencode/skills` a
`.opencode/skills` + copia en `.zcode/skills` (hallmark, impeccable, taste, shadcn, animate,
emil-design-eng, pick-ui-library, prototype, landing-factory, etc.).

## 3. Inventario open-source — qué robarle a cada uno (modelos de datos y flujos)

| Repo | Stack | Qué mirar |
|---|---|---|
| **InvenTree** | Django + Vue | Modelo de partes/stock/ubicaciones + API REST; BOM. Lo más cercano a un inventario comercial moderno |
| **Snipe-IT** | Laravel + Vue | Ciclo de vida de activos, check-in/check-out, UI de auditoría |
| **ERPNext** (Frappe) | Python/JS | **Stock Ledger Entry**: su kardex append-only es exactamente la invariante §3.2; valorización |
| **Odoo** (`odoo/odoo`, módulo stock) | Python/OWL | `stock.quant` + `stock.move`: el diseño de referencia doble-partida del inventario |
| **Grocy** | PHP | Stock con vencimientos, cantidades fraccionadas; simple de leer |
| **Part-DB / Homebox** | Symfony / Go | Ubicaciones, tags, campos custom para inventario general |

Referencia POS hermana: `../UX/repos-ref` ya tiene `pos`, `flutter-pos-system` y `mosaic` clonados.

## 4. SaaS de inventario — patrones de dashboard/UI para las skills de diseño

(Producto para mirar: Zoho Inventory, Cin7, Sortly, Odoo Inventory, Finale Inventory.)

- **KPI strip** arriba: valor del stock, SKUs, quiebres, rotación, muerto (dead stock).
- **Bandas de estado por urgencia**, peor primero: crítico → bajo → sano → exceso; badge con color **y** texto (accesibilidad).
- **Alerta accionable**: cada alerta de bajo stock enlaza a la acción (borrador de compra precargado), no solo avisa.
- **Drill-down**: dashboard → categoría → SKU → kardex/transactions.
- **Tablas densas**: búsqueda instantánea, filtros guardados por rol, acciones en lote, export CSV, timestamp de frescura de datos.
- **Saved views por rol**: comprador vs. almacén vs. dueño no quieren la misma pantalla.

Detalle aplicado a GSI en `docs/dominio.md` §9.

## 5. "jev" — verificado

**Jev** es el primer modelo **System One** de TypeSafe AI: decisiones tipadas probabilísticas con
confidence calibrada en una pasada paralela (70–500ms), sin generación de texto libre. Anuncio
oficial, ecosistema GitHub (jev-mcp, OpenJev, adaptador open source) y cómo entra al kit en
**`research/2026-09-28-jev.md`** (decisión D-009). Nota: la acepción contable *Journal Entry
Voucher* quedó solo como vocabulario ERP en `docs/dominio.md` §7.

## Fuentes

- SDD: [parserdigital.com — The Discipline Gap](https://www.parserdigital.com) (comparativa Spec Kit/OpenSpec/BMAD, 2026)
- Skills: [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills), [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills), [frontend-design (anthropics)](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [agenticskills.io](https://agenticskills.io/skills/frontend-design), [aitmpl.com/skills](https://www.aitmpl.com/skills), [firecrawl.dev roundup](https://www.firecrawl.dev/blog/best-claude-code-skills)
- Inventario OSS: [inventree.org](https://inventree.org), [virima.com roundup ITAM](https://virima.com), [cloudnuro.ai roundup](https://www.cloudnuro.ai), [thelinkshost.com self-hosted](https://thelinkshost.com), [openorchstr.com](https://openorchstr.com), [hostinger InvenTree](https://www.hostinger.com)
- JEV: [JEV — Journal Entry Voucher (documento estándar)](https://www.scribd.com/document/JEV-and-Disbursement-Process-for-MOOE)
