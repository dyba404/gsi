"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermiso } from "@/lib/roles-server";
import {
  ProductoNoEncontradoError,
  SaldoInsuficienteError,
  SkuDuplicadoError,
  crearProducto,
  movimientoInput,
  productoInput,
  registrarMovimiento,
} from "@/lib/inventario";

export type ActionResult = { ok: false; error: string; campo?: string };

function esRedirect(e: unknown): boolean {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

function errorDeZod(err: { issues: Array<{ path: PropertyKey[]; message: string }> }): ActionResult {
  const first = err.issues[0];
  return { ok: false, error: first?.message ?? "Datos inválidos", campo: String(first?.path?.[0] ?? "") };
}

export async function crearProductoAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const s = await requirePermiso("productos:administrar");
  const parsed = productoInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorDeZod(parsed.error);
  let nuevoId: string;
  try {
    const creado = await crearProducto(s.orgId, parsed.data);
    nuevoId = creado.id;
  } catch (e) {
    if (e instanceof SkuDuplicadoError) return { ok: false, error: e.message, campo: "sku" };
    console.error("[crearProductoAction]", e);
    return { ok: false, error: "No se pudo crear el producto." };
  }
  revalidatePath("/productos");
  revalidatePath("/dashboard");
  redirect(`/productos/${nuevoId}`);
}

export async function registrarMovimientoAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const s = await requirePermiso("stock:mover");
  const raw = Object.fromEntries(formData);
  const parsed = movimientoInput.safeParse(raw);
  if (!parsed.success) return errorDeZod(parsed.error);
  try {
    await registrarMovimiento(s.orgId, s.user.id, parsed.data);
    revalidatePath("/productos");
    revalidatePath("/dashboard");
    revalidatePath(`/productos/${parsed.data.productoId}`);
  } catch (e) {
    if (esRedirect(e)) throw e;
    if (e instanceof SaldoInsuficienteError) return { ok: false, error: e.message, campo: "cantidad" };
    if (e instanceof ProductoNoEncontradoError) return { ok: false, error: e.message, campo: "productoId" };
    console.error("[registrarMovimientoAction]", e);
    return { ok: false, error: "No se pudo registrar el movimiento." };
  }
  redirect(`/productos/${parsed.data.productoId}`);
}
