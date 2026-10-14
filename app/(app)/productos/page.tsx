import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeEstadoStock } from "@/components/badge-estado-stock";
import { requireSesion } from "@/lib/roles-server";
import { listarProductos } from "@/lib/inventario";
import { puede } from "@/lib/roles";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const s = await requireSesion();
  const { q } = await searchParams;
  const productos = await listarProductos(s.orgId, q?.trim() || undefined);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {productos.length} {productos.length === 1 ? "producto" : "productos"}
            {q ? ` — resultados para “${q}”` : ""}
          </p>
        </div>
        {puede(s.rol, "productos:administrar") && (
          <Link href="/productos/nuevo" className={buttonVariants({ size: "sm" })}>
            + Nuevo producto
          </Link>
        )}
      </header>

      <form action="/productos" method="get" className="flex gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, SKU o código de barras…"
          aria-label="Buscar productos"
        />
        <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Buscar
        </button>
      </form>

      {productos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">{q ? `Sin resultados para “${q}”` : "Todavía no hay productos"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q
              ? "Prueba con otro término o registra el producto nuevo."
              : "Agrega el primero para empezar a controlar tu stock."}
          </p>
          {!q && puede(s.rol, "productos:administrar") && (
            <Link href="/productos/nuevo" className={buttonVariants({ size: "sm" }) + " mt-4 inline-flex"}>
              + Agregar el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Costo prom.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/productos/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                      {p.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.sku}
                      {p.codigoBarras ? ` · ${p.codigoBarras}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(p.stock)} {p.unidadMedida}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{Number(p.stockMinimo)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(p.costoPromedio).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(Number(p.stock) * Number(p.costoPromedio)).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <BadgeEstadoStock stock={Number(p.stock)} minimo={Number(p.stockMinimo)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
