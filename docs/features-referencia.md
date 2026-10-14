# Features de referencia — qué ya está resuelto y qué adopta GSI

> Regla del proyecto: **no improvisar sobre lo resuelto**. Antes de diseñar una feature, mirar
> cómo la resuelven los sistemas maduros (open source y SaaS), adoptar el patrón probado y
> mejorar donde hay dolor real. Este doc es el índice de esa referencia; cada spec cita la fila
> que le corresponde. Formato inspirado en los FEATURES.md de `../UX/repos-ref`.

Fuentes: repos OSS (Odoo stock, ERPNext stock, InvenTree, Snipe-IT, Grocy, URY POS) y SaaS
(Zoho Inventory, Cin7 Core/OMNI, Sortly, inFlow — comparativas 2026 en research/).

## 1. Catálogo de productos

| Feature | Referencia fuerte | GSI |
|---|---|---|
| SKU + código de barras (EAN-13/Code128), múltiple por producto | Odoo, Zoho | **MVP** |
| Búsqueda instantánea por nombre/sku/escaneo | inFlow, URY POS (búsqueda en menú) | **MVP** |
| Categorías/etiquetas, unidad de medida | Todos | **MVP** |
| Variantes (talla/color) | Odoo (variantes), Cin7 | Fase 3 |
| Imágenes por producto, visibilidad toggle | Sortly (foto = identidad del ítem), URY POS | Fase 2 |
| Import/export masivo (CSV/Excel) con validación | Todos (onboarding real depende de esto) | **MVP** (import simple) → F2 (mapeo de columnas) |
| Impresión de etiquetas/códigos de barra | Zoho, inFlow | Fase 3 |

## 2. Stock y movimientos

| Feature | Referencia fuerte | GSI |
|---|---|---|
| Movimientos append-only (kardex/stock ledger) | ERPNext `Stock Ledger Entry`, Odoo `stock.move` | **MVP** (invariante central) |
| Entrada / salida / ajuste con motivo obligatorio | Todos | **MVP** |
| Traslados entre almacenes (2 movimientos vinculados) | Odoo | Fase 2 |
| Multi-almacén + ubicaciones internas (rack/estante) | Odoo (locations), Sortly (ubicaciones visuales) | Fase 2 (almacén único en MVP) |
| Lotes/series + vencimientos + FEFO | Grocy (expiry), Cin7 (batch), Odoo | Fase 3 |
| Saldo por producto en tiempo real, badge de estado | Todos | **MVP** |
| Bloqueo de saldo negativo; corrección solo por ajuste | Odoo, ERPNext (validación estricta) | **MVP** (D-004) |
| Conteo cíclico guiado con móvil → propuesta de ajuste | Odoo (Physical Inventory), Sortly | Fase 2 |
| Merma/desperdicio como tipo de salida | ERPNext, URY POS | **MVP** (motivo) → F2 (reporte) |

## 3. Compras y reposición

| Feature | Referencia fuerte | GSI |
|---|---|---|
| Proveedores + precio de referencia + lead time | Todos | Fase 2 |
| Órdenes de compra con recepción parcial | Odoo, Zoho | Fase 2 |
| Punto de reorden = demanda × lead time + seguridad | Todos | Fase 2 (alerta bajo mínimo en MVP) |
| Alerta accionable: bajo stock → borrador de compra precargado | Zoho (reorder), Cin7 | Fase 2 |
| Landed costs (flete/aduana al costo) | Cin7 Core, Odoo | Fase 3 |

## 4. Ventas y canales

| Feature | Referencia fuerte | GSI |
|---|---|---|
| Consulta de stock antes de vender / reserva | inFlow, Odoo | **MVP** (consulta) → F3 (reserva) |
| Integración POS (salidas por venta) | URY POS/ERPNext (POS opening/closing, validación contra stock) | Fase 3 |
| Multi-canal (Shopify/Amazon/Mercado Libre) | Cin7 OMNI, Zoho | Fase 3 / no prioritario |
| Clientes + precios por cliente | Zoho | Fase 3 |

## 5. Reportes y dashboard

| Feature | Referencia fuerte | GSI |
|---|---|---|
| KPI strip: valor de stock, SKUs, quiebres, movimientos del día | Todos | **MVP** |
| Rotación, días de inventario, dead stock, ABC | Cin7, ERPNext | Fase 2 |
| Exactitud de inventario (varianza de conteos) | Snipe-IT (auditoría), Odoo | Fase 2 |
| Export CSV de cualquier tabla + filtros guardados por rol | Todos | Fase 2 |

## 6. Plataforma SaaS (la capa que el usuario decidió: D-001)

| Feature | Referencia fuerte | GSI |
|---|---|---|
| Multi-tenancy con aislamiento garantizado en DB (RLS) | patrón estándar Postgres SaaS | **Spec 000** (D-003) |
| Auth + organizaciones/equipos + invitaciones | Better Auth orgs / Auth.js | **Spec 000** |
| Roles por tenant (admin, almacén, venta) + permisos finos por acción | Odoo (groups), Snipe-IT | MVP: 3 roles fijos → F2: permisos finos |
| Auditoría (quién hizo qué, todo append-only) | ERPNext (versioned docs), Snipe-IT | **MVP** en movimientos → F2 global |
| Onboarding de tenant: crear empresa + importar catálogo inicial | Zoho (wizard), inFlow | Fase 2 |
| Billing por plan (suscripción) | estándar Stripe; en Perú evaluar Culqi/Izipay | Fase 2 |
| Superadmin (métricas de la plataforma, soporte por tenant) | — | Fase 2 |
| API pública + webhooks por tenant | Odoo/Zoho (API-first) | Fase 3 |
| PWA + escaneo con cámara móvil | Sortly (mobile-first), Zoho app | Fase 2 (D-007) |

## 7. Dónde GSI mejora sobre lo resuelto (posicionamiento)

1. **Almacén en una mano**: movimiento en un solo screen (producto→cantidad→confirmar), targets
   grandes, español de barrio — los OSS maduros son de escritorio y en inglés.
2. **Kardex visible para el dueño**, no solo para el contador: confianza en el número en tiempo real.
3. **Onboarding sin capacitación**: import desde la planilla Excel que ya usa el negocio (la
   competencia real de GSI es la planilla, no Odoo).
4. **Decisiones tipadas in-product (Jev, D-009)**: clasificación/anomalías con confidence
   persistida — auditable como un movimiento.
