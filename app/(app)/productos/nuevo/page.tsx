import { requirePermiso } from "@/lib/roles-server";
import { ProductoForm } from "@/components/producto-form";

export default async function NuevoProductoPage() {
  await requirePermiso("productos:administrar");
  return (
    <div className="mx-auto grid max-w-2xl gap-6 p-4 md:p-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="text-sm text-muted-foreground">Registra un producto nuevo en tu empresa.</p>
      </header>
      <ProductoForm />
    </div>
  );
}
