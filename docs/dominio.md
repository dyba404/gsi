# Dominio — Gestión de Stock/Inventario (GSI)

> Fuente de verdad conceptual del proyecto. Las specs citan este archivo; la IA lo lee antes
> de modelar datos o escribir flujos. Vocabulario ES primero (español peruano), término EN entre paréntesis.

## 1. Modelo mental en una línea

El stock nunca se edita: **todo cambio es un movimiento** (append-only) y el stock actual es la
suma de movimientos. Dos consecuencias de diseño: trazabilidad total (kardex) y valorización
consistente (el costo sale de los movimientos, no de un campo editable).

## 2. Entidades núcleo

| Entidad | Qué es | Atributos clave |
|---|---|---|
| **Producto/SKU** (item) | Lo que se cuenta | sku/código, nombre, categoría, unidad de medida (UND, KG, CAJA…), código de barras (EAN-13 / Code128), stock mínimo/máximo, punto de reorden, activo |
| **Variante** | Versión del producto (talla/color) | Fase 3 — MVP sin variantes (`features-referencia.md` §1) |
| **Lote** (lot/batch) | Porción con origen y vencimiento | lote, fecha de vencimiento, fecha de elaboración. Fase 3 — MVP sin lotes (crítico solo con vencidos) |
| **Serie** (serial) | Unidad individual numerada | Fase 3: solo bienes durables con garantía |
| **Almacén/Ubicación** (warehouse/location) | Dónde vive el stock | MVP: un almacén por tenant; multi-almacén + ubicaciones internas (rack/estante) en fase 2 |
| **Proveedor** (supplier) | De quién se compra | datos, lead time (días), precio de referencia por producto |
| **Orden de compra** (purchase order) | Compra pendiente/recibida | estados: borrador → enviada → parcial → recibida → cerrada |
| **Movimiento** (stock move) | Cambio de stock | ver §3 |
| **Cliente/Venta** | Origen de salidas | MVP: salidas manuales por venta; integración POS/ventas en fase 3 |

## 3. Movimientos de stock (el corazón del sistema)

Tipos y su efecto (por almacén, por producto, por lote si aplica):

| Tipo | Dirección | Origen típico |
|---|---|---|
| **Entrada** (receipt) | + | Recepción de compra, devolución de cliente, sobrante de conteo |
| **Salida** (issue) | − | Venta, consumo, merma/desperdicio, traslado saliente |
| **Traslado** (transfer) | − en A, + en B | Entre almacenes; nunca pierde unidades, genera 2 movimientos vinculados |
| **Ajuste** (adjustment) | ± | Diferencia de inventario físico; SIEMPRE con motivo (merma, hallazgo, error de digitación) |

Invariantes (no negociables en el código):
1. **Atomicidad**: movimiento = transacción. O se registra el movimiento y actualiza el stock, o nada.
2. **Append-only**: no UPDATE ni DELETE sobre movimientos; corregir es un movimiento inverso.
3. **Trazabilidad**: cada movimiento sabe quién, cuándo, por qué (documento origen) y a qué costo.
4. **Salidas negativas**: bloqueadas (D-004) — ninguna salida deja saldo < 0; la diferencia física se corrige con ajuste de inventario con motivo. La excepción es un permiso por rol, nunca la ausencia de la regla.
5. **Concurrencia**: dos salidas simultáneas del último stock no deben ambas pasar si la política es bloquear (lock/fila por SKU).

## 4. Kardex (movimientos valorados)

El kardex es el historial por producto: fecha, tipo, entrada/salida/cantidad, costo unitario, saldo cantidad, saldo valor. Es la vista de auditoría Y la base de la valorización. En Perú tiene sentido fiscal (SUNAT lo reconoce como registro); aunque no se integre a contabilidad, modelarlo así evita rediseños.

## 5. Valorización (costeo)

- **Promedio ponderado** (weighted average): el más usado en PYME latam; recalcular en cada entrada. Recomendado por defecto.
- **FIFO**: por lotes/costas; necesario si hay vencimientos. Más complejo (colas de costas).
- **Costo estándar / último precio**: solo si el negocio lo pide.
- El método se define por empresa una vez; MVP = promedio ponderado (D-008).

## 6. Reposición y métricas

- **Punto de reorden** = demanda diaria promedio × lead time + stock de seguridad. Alerta cuando saldo ≤ punto.
- **Métricas del dashboard**: valor total del stock (a costo), quiebres de stock (sku bajo mínimo), rotación (costo vendido / stock promedio), días de inventario, muerto (dead stock: sin movimiento en N días), exactitud de inventario (conteo cíclico), ABC (20% de SKUs ≈ 80% del valor — clase A merece conteo frecuente).
- **Conteo cíclico** (cycle count): contar por partes cada semana > cierre anual traumático. Flujo: generar tarea de conteo → contar con móvil → sistema propone ajustes → aprobar → genera ajustes.

## 7. Contexto Perú (si el negocio lo requiere; ⚠ DECISIÓN de alcance)

- IGV 18% en compras/ventas; comprobantes (factura/boleta) y **guía de remisión** para traslados de mercadería.
- Kardex valorado como registro soporte. Si se integra contabilidad, los asientos de inventario usan comprobantes tipo **JEV (Journal Entry Voucher / comprobante de asiento contable)** — término ERP; no confundir con **Jev**, el modelo de TypeSafe AI (`research/2026-09-28-jev.md`).
- Régimen del negocio (NRUS/NERUS, RER, RG) define si necesita kardex formal.

## 8. Alcance sugerido (fases, para armar specs)

- **Spec 000 (fundación):** auth, tenants multi-empresa, roles, RLS — base obligatoria de todo (D-001/D-003).
- **MVP (spec 001):** productos + unidades, almacén único, entradas/salidas/ajustes con motivo, kardex, stock en tiempo real, promedio ponderado, búsqueda por nombre/código de barras, alerta bajo mínimo.
- **Fase 2:** órdenes de compra + recepción parcial, proveedores, conteo cíclico guiado, reportes (rotación/ABC), exportes.
- **Fase 3:** multi-almacén y traslados, lotes/vencimientos (FIFO), roles/permisos, integración POS/ventas, códigos de barra con cámara móvil.

## 9. UX que el dominio exige (puente con skills de diseño)

- Tablas densas con búsqueda instantánea, filtros guardados y acciones en lote (ver patrón dashboard SaaS en `research/`).
- Badges de estado de stock con color **y** texto/icono (accesibilidad): AGOTADO / BAJO / OK / EXCESO.
- Formulario de movimiento en un solo screen (producto → cantidad → motivo → confirmar), optimizado para una mano.
- Kardex como drawer/timeline por producto, no página aparte.
- Estados vacíos con acción ("no hay productos — agregar el primero").

## 10. Glosario rápido ES → EN (para specs y código)

stock/saldo (on hand) · movimiento (stock move) · kardex (stock ledger) · entrada (receipt) ·
salida (issue) · ajuste (adjustment) · traslado (transfer) · conteo cíclico (cycle count) ·
punto de reorden (reorder point) · quiebre (stockout) · merma (shrinkage/waste) ·
valorización (valuation) · promedio ponderado (weighted average) · almacén (warehouse) ·
ubicación (bin/location) · orden de compra (purchase order) · lote (lot/batch) · vencimiento (expiry)
