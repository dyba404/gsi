import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireSesion } from "@/lib/roles-server";
import { datosDashboard } from "@/lib/inventario";
import { ETIQUETA_TIPO } from "@/lib/estado-stock";

function dinero(v: number): string {
  return v.toLocaleString("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const s = await requireSesion();
  const { resumen, quiebres, recientes } = await datosDashboard(s.orgId);

  const kpis = [
    { label: "Valor del stock (a costo)", valor: dinero(Number(resumen.valor_total)) },
    { label: "Productos activos", valor: String(resumen.productos) },
    { label: "Agotados", valor: String(resumen.agotados), alerta: resumen.agotados > 0 },
    { label: "Bajo mínimo", valor: String(resumen.bajos), alerta: resumen.bajos > 0 },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Estado de tu inventario ahora mismo.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${k.alerta ? "text-red-600 dark:text-red-400" : ""}`}>
              {k.valor}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-sm font-semibold">Top reposición (bajo mínimo)</h2>
            <Link href="/productos" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              ver productos
            </Link>
          </div>
          {quiebres.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nada por reponer: todo está sobre el mínimo. 🎉</p>
          ) : (
            <ul className="divide-y">
              {quiebres.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/productos/${q.id}`} className="truncate font-medium underline-offset-4 hover:underline">
                      {q.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">{q.sku}</p>
                  </div>
                  <p className="shrink-0 tabular-nums text-red-600 dark:text-red-400">
                    {Number(q.stock)} / min {Number(q.stock_minimo)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">Movimientos recientes</h2>
          </div>
          {recientes.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Aún no hay movimientos.{" "}
              <Link href="/movimientos/nuevo" className={buttonVariants({ size: "sm", variant: "outline" }) + " ml-1"}>
                Registrar el primero
              </Link>
            </p>
          ) : (
            <ul className="divide-y">
              {recientes.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.producto}</p>
                    <p className="text-xs text-muted-foreground">{m.sku}</p>
                  </div>
                  <p className="shrink-0 tabular-nums">
                    <span className={m.sentido > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      {m.sentido > 0 ? "+" : "−"}
                      {Number(m.cantidad)}
                    </span>{" "}
                    <span className="text-xs text-muted-foreground">{ETIQUETA_TIPO[m.tipo]}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
