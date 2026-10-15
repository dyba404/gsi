# Research — Ecosistema del producto (2026-09-28)

Investigación inicial: inventario open source, SaaS de inventario y JEV. Fuentes al final.

## 3. Inventario open-source — qué tomar de cada uno (modelos de datos y flujos)

| Repo | Stack | Qué mirar |
|---|---|---|
| **InvenTree** | Django + Vue | Modelo de partes/stock/ubicaciones + API REST; BOM. Lo más cercano a un inventario comercial moderno |
| **Snipe-IT** | Laravel + Vue | Ciclo de vida de activos, check-in/check-out, UI de auditoría |
| **ERPNext** (Frappe) | Python/JS | **Stock Ledger Entry**: su kardex append-only es exactamente la invariante §3.2; valorización |
| **Odoo** (`odoo/odoo`, módulo stock) | Python/OWL | `stock.quant` + `stock.move`: el diseño de referencia doble-partida del inventario |
| **Grocy** | PHP | Stock con vencimientos, cantidades fraccionadas; simple de leer |
| **Part-DB / Homebox** | Symfony / Go | Ubicaciones, tags, campos custom para inventario general |

Referencia POS hermana: `../UX/repos-ref` ya tiene `pos`, `flutter-pos-system` y `mosaic` clonados.

## 4. SaaS de inventario — patrones de dashboard/UI

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
oficial, ecosistema GitHub (jev-mcp, OpenJev, adaptador open source) y cómo entraría al producto en
**`research/2026-09-28-jev.md`** (decisión D-009). Nota: la acepción contable *Journal Entry
Voucher* quedó solo como vocabulario ERP en `docs/dominio.md` §7.

## Fuentes

- Inventario OSS: [inventree.org](https://inventree.org), [virima.com roundup ITAM](https://virima.com), [cloudnuro.ai roundup](https://www.cloudnuro.ai), [thelinkshost.com self-hosted](https://thelinkshost.com), [openorchstr.com](https://openorchstr.com), [hostinger InvenTree](https://www.hostinger.com)
- JEV: [JEV — Journal Entry Voucher (documento estándar)](https://www.scribd.com/document/JEV-and-Disbursement-Process-for-MOOE)
