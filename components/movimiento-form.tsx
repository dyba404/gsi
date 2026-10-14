"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarMovimientoAction, type ActionResult } from "@/app/actions/inventario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OpcionProducto = { id: string; sku: string; nombre: string; stock: string; unidadMedida: string };

export function MovimientoForm({ productos }: { productos: OpcionProducto[] }) {
  const [estado, action, pendiente] = useActionState<ActionResult | null, FormData>(
    registrarMovimientoAction,
    null,
  );
  const [busqueda, setBusqueda] = useState("");
  const [productoId, setProductoId] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "salida" | "ajuste">("entrada");
  const [direccion, setDireccion] = useState<"sobrante" | "faltante">("faltante");

  const seleccionado = useMemo(() => productos.find((p) => p.id === productoId), [productos, productoId]);

  const opciones = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = q
      ? productos.filter((p) => `${p.nombre} ${p.sku}`.toLowerCase().includes(q))
      : productos;
    return lista.slice(0, 50);
  }, [productos, busqueda]);

  const err = estado && !estado.ok ? estado : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar movimiento</CardTitle>
        <CardDescription>
          Un solo paso: producto → tipo → cantidad → confirmar. El kardex queda registrado automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="productoId" value={productoId} />
          {/* Los Select de Base UI no serializan en FormData: viajan como hidden. */}
          <input type="hidden" name="tipo" value={tipo} />
          <input type="hidden" name="direccion" value={tipo === "ajuste" ? direccion : ""} />

          <div className="grid gap-2">
            <Label htmlFor="buscar">Producto *</Label>
            <Input
              id="buscar"
              placeholder="Escribe para buscar por nombre o SKU…"
              value={seleccionado ? `${seleccionado.nombre} (${seleccionado.sku})` : busqueda}
              onChange={(e) => {
                setSeleccionNone();
                setBusqueda(e.target.value);
              }}
              autoComplete="off"
              aria-invalid={err?.campo === "productoId"}
            />
            {!seleccionado && busqueda && (
              <ul className="max-h-48 overflow-y-auto rounded-md border" role="listbox" aria-label="Resultados">
                {opciones.length === 0 && <li className="p-3 text-sm text-muted-foreground">Sin resultados</li>}
                {opciones.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => elegir(p.id)}
                      className="flex w-full items-center justify-between gap-3 p-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.nombre}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.sku}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {Number(p.stock)} {p.unidadMedida}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {err?.campo === "productoId" && (
              <p role="alert" className="text-sm text-destructive">
                {err.error}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={tipo}
                onValueChange={(v) => {
                  setTipo(v as typeof tipo);
                }}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (compra / devolución)</SelectItem>
                  <SelectItem value="salida">Salida (venta / consumo)</SelectItem>
                  <SelectItem value="ajuste">Ajuste de inventario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                min="0.001"
                step="0.001"
                required
                aria-invalid={err?.campo === "cantidad"}
              />
              {err?.campo === "cantidad" && (
                <p role="alert" className="text-sm text-destructive">
                  {err.error}
                </p>
              )}
            </div>
          </div>

          {tipo === "entrada" && (
            <div className="grid gap-2">
              <Label htmlFor="costoUnitario">Costo unitario *</Label>
              <Input
                id="costoUnitario"
                name="costoUnitario"
                type="number"
                min="0.0001"
                step="0.0001"
                required
                aria-invalid={err?.campo === "costoUnitario"}
              />
              {err?.campo === "costoUnitario" && (
                <p role="alert" className="text-sm text-destructive">
                  {err.error}
                </p>
              )}
            </div>
          )}

          {tipo === "ajuste" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Select
                  value={direccion}
                  onValueChange={(v) => setDireccion(v as typeof direccion)}
                >
                  <SelectTrigger id="direccion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sobrante">Sobrante (+)</SelectItem>
                    <SelectItem value="faltante">Faltante / merma (−)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Input
                  id="motivo"
                  name="motivo"
                  required
                  maxLength={200}
                  placeholder="conteo cíclico, merma, rotura…"
                  aria-invalid={err?.campo === "motivo"}
                />
                {err?.campo === "motivo" && (
                  <p role="alert" className="text-sm text-destructive">
                    {err.error}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="nota">Nota (opcional)</Label>
            <Input id="nota" name="nota" maxLength={500} />
          </div>

          {err && !err.campo && (
            <p role="alert" className="text-sm text-destructive">
              {err.error}
            </p>
          )}

          <Button type="submit" disabled={pendiente || !productoId} className="w-fit">
            {pendiente ? "Registrando…" : "Confirmar movimiento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  function elegir(id: string) {
    setProductoId(id);
    setBusqueda("");
  }

  function setSeleccionNone() {
    setProductoId("");
  }
}
