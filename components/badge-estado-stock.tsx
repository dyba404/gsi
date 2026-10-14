import { Badge } from "@/components/ui/badge";
import { estadoStock } from "@/lib/estado-stock";
import type { ReactNode } from "react";

const ESTILOS: Record<string, string> = {
  agotado: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  bajo: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  ok: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-900",
  exceso: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
};

const ICONOS: Record<string, ReactNode> = {
  agotado: "■",
  bajo: "▲",
  ok: "●",
  exceso: "◆",
};

export function BadgeEstadoStock({ stock, minimo }: { stock: number; minimo: number }) {
  const e = estadoStock(stock, minimo);
  return (
    <Badge variant="outline" className={`gap-1 ${ESTILOS[e.key]}`} title={`Estado de stock: ${e.label}`}>
      <span aria-hidden>{ICONOS[e.key]}</span>
      {e.label}
      <span className="sr-only">
        {e.key === "agotado" && ": sin stock"}
        {e.key === "bajo" && ": debajo del mínimo"}
        {e.key === "ok" && ": stock saludable"}
        {e.key === "exceso" && ": stock excedido"}
      </span>
    </Badge>
  );
}
