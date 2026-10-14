import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { BadgeEstadoStock } from "@/components/badge-estado-stock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSesion } from "@/lib/roles-server";
import { obtenerProductoYKardex } from "@/lib/inventario";
import { ETIQUETA_TIPO } from "@/lib/estado-stock";
import { puede } from "@/lib/roles";

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSesion();
  const { id } = await params;
  const data = await obtenerProductoYKardex(s.orgId, id);
  if (!data) notFound();
  const { producto: p, kardex } = data;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/productos" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            ← Productos
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{p.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {p.sku}
            {p.codigoBarras ? ` · ${p.codigoBarras}` : ""}
            {p.categoria ? ` · ${p.categoria}` : ""}
          </p>
        </div>
        {puede(s.rol, "stock:mover") && (
          <Link href="/movimientos/nuevo" className={buttonVariants({ size: "sm" })}>
            + Movimiento
          </Link>
        )}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Stock actual</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular-nums">
            {Number(p.stock)} <span className="text-sm font-normal text-muted-foreground">{p.unidadMedida}</span>
          </p>
          <div className="mt-2">
            <BadgeEstadoStock stock={Number(p.stock)} minimo={Number(p.stockMinimo)} />
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Stock mínimo</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{Number(p.stockMinimo)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Costo promedio</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{Number(p.costoPromedio).toFixed(4)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Valor a costo</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {(Number(p.stock) * Number(p.costoPromedio)).toFixed(2)}
          </p>
        </div>
      </section>

      <section className="rounded-lg border">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">Kardex (movimientos valorados)</h2>
          <p className="text-xs text-muted-foreground">Append-only: cada cambio de stock vive aquí para siempre.</p>
        </div>
        {kardex.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Sin movimientos todavía. Registra una entrada para que este producto exista en el inventario.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo unit.</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Promedio</TableHead>
                  <TableHead>Motivo / nota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kardex.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <span className={m.sentido > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {ETIQUETA_TIPO[m.tipo]} {m.sentido > 0 ? "+" : "−"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{Number(m.cantidad)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(m.costoUnitario).toFixed(4)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{Number(m.saldoDespues)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(m.costoPromedioDespues).toFixed(4)}</TableCell>
                    <TableCell className="text-muted-foreground">{m.motivo ?? m.nota ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
