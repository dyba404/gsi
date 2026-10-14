import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { member, organization } from "../db/schema";
import { esRol, puede, type Role } from "./roles";

// Guards de servidor (T-11). La membresía se lee directo de la tabla member
// (global, sin RLS, protegida por la capa de auth) — determinista y sin sorpresas.

export async function getSesionYMiembro() {
  const session = await auth.api.getSession({ headers: await headers() });
  const orgId = session?.session.activeOrganizationId;
  if (!session?.user || !orgId) return null;
  const rows = await db
    .select()
    .from(member)
    .where(and(eq(member.userId, session.user.id), eq(member.organizationId, orgId)))
    .limit(1);
  const m = rows[0];
  if (!m || !esRol(m.role)) return null;
  const [org] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);
  return {
    session,
    user: session.user,
    orgId,
    orgNombre: org?.name ?? "",
    rol: m.role as Role,
    memberId: m.id,
  };
}

export async function requireSesion() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/iniciar-sesion");
  const s = await getSesionYMiembro();
  // Con sesión pero sin organización activa (p. ej. invitado aún no acepta): no rebota a login.
  if (!s) redirect("/sin-empresa");
  return s;
}

export async function requirePermiso(permiso: string) {
  const s = await requireSesion();
  if (!puede(s.rol, permiso)) throw new Error(`Sin permiso: ${permiso}`);
  return s;
}
