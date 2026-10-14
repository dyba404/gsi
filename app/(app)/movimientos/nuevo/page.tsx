import Link from "next/link";
import { requireSesion } from "@/lib/roles-server";
import { listarProductos } from "@/lib/inventario";
import { puede } from "@/lib/roles";
import { MovimientoForm } from "@/components/movimiento-form";

export default async function NuevoMovimientoPage() {
  const s = await requireSesion();
  if (!puede(s.rol, "stock:mover")) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Tu rol no puede mover stock. Solo consulta.
        </p>
        <p className="mt-4 text-center">
          <Link href="/productos" className="text-sm underline underline-offset-4">
            Volver a productos
          </Link>
        </p>
      </div>
    );
  }
  const productos = await listarProductos(s.orgId);
  return (
    <div className="mx-auto grid max-w-2xl gap-6 p-4 md:p-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Movimiento de stock</h1>
        <p className="text-sm text-muted-foreground">Cada movimiento queda en el kardex, append-only.</p>
      </header>
      <MovimientoForm productos={productos} />
    </div>
  );
}
