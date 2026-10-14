import { NavApp } from "@/components/nav-app";
import { requireSesion } from "@/lib/roles-server";
import { ETIQUETA_ROL } from "@/lib/roles";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSesion();
  return (
    <div className="flex min-h-svh flex-col">
      <NavApp nombreOrg={s.orgNombre ?? ""} rol={ETIQUETA_ROL[s.rol]} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
