import { requireSesion } from "@/lib/roles-server";
import { MiembrosEquipo } from "@/components/equipo-client";

export default async function EquipoPage() {
  const s = await requireSesion();
  return (
    <main className="flex flex-1 items-start justify-center p-6">
      <div className="w-full max-w-2xl grid gap-6">
        <header className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="text-sm text-muted-foreground">
            Miembros de tu empresa y sus roles. Invita a tu encargado de almacén o cajero.
          </p>
        </header>
        <MiembrosEquipo orgId={s.orgId} rol={s.rol} sesionUserId={s.user.id} />
      </div>
    </main>
  );
}
