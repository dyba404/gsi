import "server-only";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { movimiento, producto } from "../db/schema";
import { withTenant, type TenantTx } from "./tenant";

// Dominio de inventario (spec 001 / docs/dominio.md §3–§5).
// Pure domain: el tenantId entra por parámetro; RLS garantiza el aislamiento.

export class SaldoInsuficienteError extends Error {
  constructor(nombre: string, stock: number, pedido: number) {
    super(`Stock insuficiente de "${nombre}": hay ${stock}, se pidió mover ${pedido}.`);
    this.name = "SaldoInsuficienteError";
  }
}
export class SkuDuplicadoError extends Error {
  constructor(sku: string) {
    super(`El SKU "${sku}" ya existe en esta empresa.`);
    this.name = "SkuDuplicadoError";
  }
}
export class ProductoNoEncontradoError extends Error {
  constructor() {
    super("Producto no encontrado.");
    this.name = "ProductoNoEncontradoError";
  }
}

export type Tx = TenantTx;

// ─── Validación (zod) ─────────────────────────────────────────────────────────

export const productoInput = z.object({
  sku: z.string().trim().min(1, "SKU requerido").max(64),
  nombre: z.string().trim().min(1, "Nombre requerido").max(200),
  categoria: z.string().trim().max(100).optional().or(z.literal("")),
  unidadMedida: z.string().trim().min(1).max(20).default("UND"),
  codigoBarras: z.string().trim().max(64).optional().or(z.literal("")),
  stockMinimo: z.coerce.number().min(0, "No puede ser negativo").default(0),
});

export const movimientoInput = z
  .object({
    productoId: z.string().uuid("Producto inválido"),
    tipo: z.enum(["entrada", "salida", "ajuste"]),
    // Los hidden inputs mandan "" cuando no aplican: normalizar a undefined antes del enum.
    direccion: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.enum(["sobrante", "faltante"]).optional(),
    ),
    cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    costoUnitario: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().positive("El costo debe ser mayor a 0").optional(),
    ),
    motivo: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().trim().min(1, "El motivo es obligatorio en ajustes").max(200).optional(),
    ),
    nota: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().trim().max(500).optional(),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.tipo === "entrada" && !v.costoUnitario) {
      ctx.addIssue({ code: "custom", path: ["costoUnitario"], message: "La entrada requiere costo unitario" });
    }
    if (v.tipo === "ajuste" && !v.motivo) {
      ctx.addIssue({ code: "custom", path: ["motivo"], message: "El ajuste requiere motivo" });
    }
    if (v.tipo === "ajuste" && !v.direccion) {
      ctx.addIssue({ code: "custom", path: ["direccion"], message: "Indica si es sobrante o faltante" });
    }
  });

export type ProductoInput = z.infer<typeof productoInput>;
export type MovimientoInput = z.infer<typeof movimientoInput>;
export type ProductoInputIn = z.input<typeof productoInput>;

const n3 = (x: number) => x.toFixed(3);
const n4 = (x: number) => x.toFixed(4);

// ─── Comandos ─────────────────────────────────────────────────────────────────

export async function crearProducto(tenantId: string, input: ProductoInputIn) {
  const data = productoInput.parse(input);
  return withTenant(tenantId, async (tx) => {
    const dup = await tx
      .select({ id: producto.id })
      .from(producto)
      .where(eq(producto.sku, data.sku))
      .limit(1);
    if (dup.length > 0) throw new SkuDuplicadoError(data.sku);
    const [row] = await tx
      .insert(producto)
      .values({
        tenantId,
        sku: data.sku,
        nombre: data.nombre,
        categoria: data.categoria || null,
        unidadMedida: data.unidadMedida,
        codigoBarras: data.codigoBarras || null,
        stockMinimo: n3(data.stockMinimo),
      })
      .returning();
    return row;
  });
}

/**
 * Registra un movimiento (kardex append-only) y actualiza el saldo/costo del
 * producto en LA MISMA transacción. Lock FOR UPDATE por producto: serializa
 * movimientos del mismo SKU y hace imposible el sobregiro (D-004).
 * El promedio ponderado se calcula en SQL numérico, nunca en float de JS.
 */
export async function registrarMovimiento(tenantId: string, usuarioId: string, input: MovimientoInput) {
  const data = movimientoInput.parse(input);
  const sentido = data.tipo === "entrada" ? 1 : data.tipo === "salida" ? -1 : data.direccion === "faltante" ? -1 : 1;

  return withTenant(tenantId, async (tx) => {
    const [prod] = await tx
      .select()
      .from(producto)
      .where(eq(producto.id, data.productoId))
      .for("update")
      .limit(1);
    if (!prod) throw new ProductoNoEncontradoError();

    const stockActual = Number(prod.stock);
    const promedioVigente = Number(prod.costoPromedio);
    const nuevoStock = Number((stockActual + sentido * data.cantidad).toFixed(3));
    if (nuevoStock < 0) throw new SaldoInsuficienteError(prod.nombre, stockActual, data.cantidad);

    const costoUnitario = data.tipo === "entrada" ? data.costoUnitario! : promedioVigente;
    // Los parámetros del template SQL se evalúan aunque el CASE no use la rama:
    // para salida/ajuste el costo de entrada es 0 y no participa.
    const costoEntrada = data.tipo === "entrada" ? data.costoUnitario! : 0;

    // UPDATE atómico: promedio ponderado en SQL (exacto), snapshots para el kardex.
    const resultado = await tx.execute(sql`
      UPDATE producto SET
        stock = ${n3(nuevoStock)}::numeric,
        costo_promedio = CASE
          WHEN ${data.tipo} = 'entrada' THEN
            ROUND(
              (( ${n3(stockActual)}::numeric * ${n4(promedioVigente)}::numeric )
                + ( ${n3(data.cantidad)}::numeric * ${n4(costoEntrada)}::numeric ))
              / ${n3(nuevoStock)}::numeric, 4)
          ELSE costo_promedio
        END,
        updated_at = now()
      WHERE id = ${data.productoId}
      RETURNING stock::text AS stock, costo_promedio::text AS costo_promedio
    `);
    const fila = (resultado.rows as Array<{ stock: string; costo_promedio: string }>)[0];
    if (!fila) throw new ProductoNoEncontradoError();

    const [mov] = await tx
      .insert(movimiento)
      .values({
        tenantId,
        productoId: data.productoId,
        tipo: data.tipo,
        sentido,
        cantidad: n3(data.cantidad),
        costoUnitario: n4(costoUnitario),
        motivo: data.motivo ?? null,
        nota: data.nota || null,
        saldoDespues: fila.stock,
        costoPromedioDespues: fila.costo_promedio,
        usuarioId,
      })
      .returning();

    return mov;
  });
}

// ─── Consultas ────────────────────────────────────────────────────────────────

export type ProductoLista = {
  id: string;
  sku: string;
  nombre: string;
  categoria: string | null;
  unidadMedida: string;
  codigoBarras: string | null;
  stockMinimo: string;
  stock: string;
  costoPromedio: string;
};

export async function listarProductos(tenantId: string, q?: string): Promise<ProductoLista[]> {
  return withTenant(tenantId, async (tx) => {
    const base = tx
      .select({
        id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        categoria: producto.categoria,
        unidadMedida: producto.unidadMedida,
        codigoBarras: producto.codigoBarras,
        stockMinimo: producto.stockMinimo,
        stock: producto.stock,
        costoPromedio: producto.costoPromedio,
      })
      .from(producto)
      .where(
        q
          ? and(
              eq(producto.activo, true),
              or(
                ilike(producto.nombre, `%${q}%`),
                ilike(producto.sku, `%${q}%`),
                ilike(producto.codigoBarras, `%${q}%`),
              ),
            )
          : eq(producto.activo, true),
      )
      .orderBy(producto.nombre)
      .limit(500);
    return base;
  });
}

export async function obtenerProductoYKardex(tenantId: string, productoId: string) {
  return withTenant(tenantId, async (tx) => {
    const [prod] = await tx.select().from(producto).where(eq(producto.id, productoId)).limit(1);
    if (!prod) return null;
    const kardex = await tx
      .select()
      .from(movimiento)
      .where(eq(movimiento.productoId, productoId))
      .orderBy(desc(movimiento.createdAt))
      .limit(200);
    return { producto: prod, kardex };
  });
}

export async function datosDashboard(tenantId: string) {
  return withTenant(tenantId, async (tx) => {
    const resumen = await tx.execute(sql`
      SELECT
        count(*)::int AS productos,
        COALESCE(SUM(stock * costo_promedio), 0)::text AS valor_total,
        COALESCE(SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END), 0)::int AS agotados,
        COALESCE(SUM(CASE WHEN stock > 0 AND stock < stock_minimo THEN 1 ELSE 0 END), 0)::int AS bajos
      FROM producto WHERE activo = true
    `);
    const quiebres = await tx.execute(sql`
      SELECT id, sku, nombre, stock::text AS stock, stock_minimo::text AS stock_minimo
      FROM producto
      WHERE activo = true AND stock < stock_minimo
      ORDER BY (stock_minimo - stock) DESC
      LIMIT 5
    `);
    const recientes = await tx.execute(sql`
      SELECT m.tipo, m.sentido, m.cantidad::text AS cantidad, m.created_at,
             p.nombre AS producto, p.sku
      FROM movimiento m JOIN producto p ON p.id = m.producto_id
      ORDER BY m.created_at DESC LIMIT 8
    `);
    return {
      resumen: (resumen.rows as Array<{ productos: number; valor_total: string; agotados: number; bajos: number }>)[0],
      quiebres: quiebres.rows as Array<{ id: string; sku: string; nombre: string; stock: string; stock_minimo: string }>,
      recientes: recientes.rows as Array<{ tipo: string; sentido: number; cantidad: string; created_at: string; producto: string; sku: string }>,
    };
  });
}
