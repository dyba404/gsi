// Estado de stock (dominio §9): SIEMPRE color + texto + icono (nunca solo color).
export type EstadoStock = {
  key: "agotado" | "bajo" | "ok" | "exceso";
  label: string;
};

export function estadoStock(stock: number, minimo: number): EstadoStock {
  if (stock <= 0) return { key: "agotado", label: "AGOTADO" };
  if (stock < minimo) return { key: "bajo", label: "BAJO" };
  if (minimo > 0 && stock > minimo * 5) return { key: "exceso", label: "EXCESO" };
  return { key: "ok", label: "OK" };
}

export const ETIQUETA_TIPO: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
};
