"use client";

import { useActionState } from "react";
import { crearProductoAction, type ActionResult } from "@/app/actions/inventario";
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

export function ProductoForm() {
  const [estado, action, pendiente] = useActionState<ActionResult | null, FormData>(crearProductoAction, null);
  const err = estado && !estado.ok ? estado : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo producto</CardTitle>
        <CardDescription>El stock empieza en 0: regístralo con un movimiento de entrada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" name="sku" required maxLength={64} aria-invalid={err?.campo === "sku"} />
              {err?.campo === "sku" && (
                <p role="alert" className="text-sm text-destructive">
                  {err.error}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="codigoBarras">Código de barras</Label>
              <Input id="codigoBarras" name="codigoBarras" maxLength={64} aria-invalid={err?.campo === "codigoBarras"} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" required maxLength={200} aria-invalid={err?.campo === "nombre"} />
            {err?.campo === "nombre" && (
              <p role="alert" className="text-sm text-destructive">
                {err.error}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input id="categoria" name="categoria" maxLength={100} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unidadMedida">Unidad</Label>
              <Input id="unidadMedida" name="unidadMedida" defaultValue="UND" maxLength={20} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stockMinimo">Stock mínimo</Label>
              <Input id="stockMinimo" name="stockMinimo" type="number" min="0" step="0.001" defaultValue="0" />
            </div>
          </div>
          {err && !err.campo && (
            <p role="alert" className="text-sm text-destructive">
              {err.error}
            </p>
          )}
          <Button type="submit" disabled={pendiente} className="w-fit">
            {pendiente ? "Guardando…" : "Crear producto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
