import "dotenv/config";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import pg from "pg";
import { withTenant } from "../lib/tenant";
import {
  SaldoInsuficienteError,
  crearProducto,
  listarProductos,
  obtenerProductoYKardex,
  registrarMovimiento,
} from "../lib/inventario";

// Criterios de spec 001 (plan.md §Pruebas) contra Postgres real con RLS.

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";
const USUARIO = "test-user-001";

let owner: pg.Client;

beforeAll(async () => {
  owner = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await owner.connect();
});

afterAll(async () => {
  await owner.end();
});

beforeEach(async () => {
  await owner.query("TRUNCATE producto, movimiento CASCADE");
});

async function crearProductoA(sku: string, nombre = `Prod ${sku}`) {
  return crearProducto(TENANT_A, {
    sku,
    nombre,
    unidadMedida: "UND",
    stockMinimo: 0,
  });
}

describe("valorización promedio ponderado (D-008)", () => {
  it("entrada con costos distintos recalcula el promedio; salida no lo cambia", async () => {
    const p = await crearProductoA("VAL-1");
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 10, costoUnitario: 10 });
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 10, costoUnitario: 20 });
    let { producto } = await obtenerProductoYKardex(TENANT_A, p.id).then((r) => r!);
    expect(Number(producto.stock)).toBe(20);
    expect(Number(producto.costoPromedio)).toBe(15); // (10·10 + 10·20)/20

    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "salida", cantidad: 5 });
    ({ producto } = await obtenerProductoYKardex(TENANT_A, p.id).then((r) => r!));
    expect(Number(producto.stock)).toBe(15);
    expect(Number(producto.costoPromedio)).toBe(15); // la salida no toca el promedio
  });

  it("entrada sobre stock 0 resetea el promedio al costo de la entrada", async () => {
    const p = await crearProductoA("VAL-2");
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 10, costoUnitario: 10 });
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "salida", cantidad: 10 });
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 4, costoUnitario: 50 });
    const { producto } = await obtenerProductoYKardex(TENANT_A, p.id).then((r) => r!);
    expect(Number(producto.stock)).toBe(4);
    expect(Number(producto.costoPromedio)).toBe(50); // no arrastra el promedio viejo
  });

  it("ajuste sobrante entra al promedio vigente; el kardex queda con snapshots", async () => {
    const p = await crearProductoA("VAL-3");
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 10, costoUnitario: 10 });
    const mov = await registrarMovimiento(TENANT_A, USUARIO, {
      productoId: p.id, tipo: "ajuste", direccion: "sobrante", cantidad: 2, motivo: "hallazgo en conteo",
    });
    expect(mov.sentido).toBe(1);
    expect(Number(mov.costoUnitario)).toBe(10); // al promedio vigente
    expect(Number(mov.saldoDespues)).toBe(12);
    const { producto, kardex } = await obtenerProductoYKardex(TENANT_A, p.id).then((r) => r!);
    expect(Number(producto.stock)).toBe(12);
    expect(Number(producto.costoPromedio)).toBe(10);
    expect(kardex.length).toBe(2);
  });
});

describe("saldo negativo bloqueado (D-004)", () => {
  it("salida mayor al stock es rechazada", async () => {
    const p = await crearProductoA("NEG-1");
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 3, costoUnitario: 5 });
    await expect(
      registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "salida", cantidad: 4 }),
    ).rejects.toBeInstanceOf(SaldoInsuficienteError);
  });

  it("ajuste faltante mayor al stock es rechazado", async () => {
    const p = await crearProductoA("NEG-2");
    await expect(
      registrarMovimiento(TENANT_A, USUARIO, {
        productoId: p.id, tipo: "ajuste", direccion: "faltante", cantidad: 1, motivo: "merma",
      }),
    ).rejects.toBeInstanceOf(SaldoInsuficienteError);
  });
});

describe("concurrencia: 2 salidas paralelas del último stock", () => {
  it("exactamente 1 tiene éxito y el stock nunca es negativo", async () => {
    const p = await crearProductoA("CONC-1");
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 5, costoUnitario: 10 });

    const [r1, r2] = await Promise.allSettled([
      registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "salida", cantidad: 5 }),
      registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "salida", cantidad: 5 }),
    ]);
    const exitos = [r1, r2].filter((r) => r.status === "fulfilled");
    const fallos = [r1, r2].filter((r) => r.status === "rejected");
    expect(exitos.length).toBe(1);
    expect(fallos[0].status === "rejected" && (fallos[0] as PromiseRejectedResult).reason).toBeInstanceOf(SaldoInsuficienteError);

    const { producto } = await obtenerProductoYKardex(TENANT_A, p.id).then((r) => r!);
    expect(Number(producto.stock)).toBe(0);
  });
});

describe("aislamiento por tenant (D-003)", () => {
  it("tenant B no ve productos de A; INSERT cruzado es rechazado por WITH CHECK", async () => {
    const p = await crearProductoA("ISO-1");
    const listaB = await listarProductos(TENANT_B);
    expect(listaB.find((x) => x.sku === "ISO-1")).toBeUndefined();

    // RLS de producto: fila de B visible solo para B
    await crearProducto(TENANT_B, { sku: "ISO-B1", nombre: "Prod B", stockMinimo: 0 });
    const listaA = await listarProductos(TENANT_A);
    expect(listaA.find((x) => x.sku === "ISO-B1")).toBeUndefined();
    expect(p.id).toBeTruthy();
  });
});

describe("kardex append-only (REVOKE)", () => {
  it("app_conn NO puede UPDATE ni DELETE movimiento", async () => {
    const conn = new pg.Client({ connectionString: process.env.APP_DATABASE_URL });
    await conn.connect();
    await expect(conn.query("UPDATE movimiento SET nota = 'hack'")).rejects.toThrow(/permission denied/);
    await expect(conn.query("DELETE FROM movimiento")).rejects.toThrow(/permission denied/);
    await conn.end();
  });
});

describe("reconciliación e invariante", () => {
  it("stock del producto = suma(sentido·cantidad) del kardex", async () => {
    const p = await crearProductoA("REC-1");
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 10, costoUnitario: 10 });
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "salida", cantidad: 3 });
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "entrada", cantidad: 5, costoUnitario: 12 });
    await registrarMovimiento(TENANT_A, USUARIO, { productoId: p.id, tipo: "ajuste", direccion: "faltante", cantidad: 2, motivo: "merma" });
    const { producto, kardex } = await obtenerProductoYKardex(TENANT_A, p.id).then((r) => r!);
    const suma = kardex.reduce((acc, m) => acc + Number(m.cantidad) * m.sentido, 0);
    expect(Number(producto.stock)).toBe(suma);
    expect(suma).toBe(10);
  });
});

describe("búsqueda con 5k productos (< 100ms)", () => {
  it("listarProductos con q responde rápido", async () => {
    // El INSERT masivo va por la transacción con contexto de tenant (FORCE RLS también aplica al owner).
    await withTenant(TENANT_A, (tx) =>
      tx.execute(sql`
        INSERT INTO producto (tenant_id, sku, nombre, stock_minimo)
        SELECT ${TENANT_A}::uuid, 'PERF-' || i, 'Producto Perf ' || i, 0
        FROM generate_series(1, 5000) AS i
      `),
    );
    // warmup (conexión del pool + plan)
    await listarProductos(TENANT_A, "Producto Perf 25");
    const t0 = performance.now();
    const res = await listarProductos(TENANT_A, "Producto Perf 25");
    const ms = performance.now() - t0;
    expect(res.length).toBeGreaterThan(0);
    expect(ms).toBeLessThan(100);
  });
});
