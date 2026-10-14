import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSesionYMiembro } from "@/lib/roles-server";

export default async function SinEmpresaPage() {
  const s = await getSesionYMiembro();
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center grid gap-4">
        <h1 className="text-2xl font-semibold">Todavía no perteneces a ninguna empresa</h1>
        <p className="text-muted-foreground">
          {s
            ? `Hola, ${s.user.name}. O alguien de tu equipo te invitó (revisa el link de invitación), o crea tu propia empresa para empezar a controlar tu stock.`
            : "Inicia sesión primero."}
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/registrarse" className={buttonVariants()}>
            Crear mi empresa
          </Link>
          <Link href="/iniciar-sesion" className={buttonVariants({ variant: "outline" })}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
