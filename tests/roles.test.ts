import { describe, expect, it } from "vitest";
import { puede } from "../lib/roles";

// Matriz de permisos T-11 (criterio: los roles no administrativos no invitan).
describe("matriz de permisos", () => {
  it("owner tiene todo", () => {
    expect(puede("owner", "equipo:invitar")).toBe(true);
    expect(puede("owner", "stock:mover")).toBe(true);
    expect(puede("owner", "reportes:ver")).toBe(true);
  });
  it("admin invita y ve reportes, pero la matriz lo define explícito", () => {
    expect(puede("admin", "equipo:invitar")).toBe(true);
    expect(puede("admin", "reportes:ver")).toBe(true);
    expect(puede("admin", "stock:mover")).toBe(true);
  });
  it("almacen mueve stock pero no invita ni ve reportes", () => {
    expect(puede("almacen", "stock:mover")).toBe(true);
    expect(puede("almacen", "equipo:invitar")).toBe(false);
    expect(puede("almacen", "reportes:ver")).toBe(false);
  });
  it("venta solo consulta stock", () => {
    expect(puede("venta", "stock:ver")).toBe(true);
    expect(puede("venta", "stock:mover")).toBe(false);
    expect(puede("venta", "productos:administrar")).toBe(false);
  });
});
