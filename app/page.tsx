import { redirect } from "next/navigation";
import { getSesionYMiembro } from "@/lib/roles-server";

export default async function Home() {
  const s = await getSesionYMiembro();
  if (!s) redirect("/iniciar-sesion");
  if (!s.orgId) redirect("/sin-empresa");
  redirect("/dashboard");
}
