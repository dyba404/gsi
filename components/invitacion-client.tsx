"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InvitacionClient({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const { data: sesion, isPending } = authClient.useSession();
  const [estado, setEstado] = useState<"listo" | "aceptando" | "aceptada" | "error">("listo");
  const [detalle, setDetalle] = useState<string | null>(null);

  useEffect(() => {
    if (!sesion) return;
    setEstado("aceptando");
    void (async () => {
      const { error } = await authClient.organization.acceptInvitation({ invitationId });
      if (error) {
        setEstado("error");
        setDetalle(error.message ?? "La invitación no es válida o ya fue usada.");
        return;
      }
      setEstado("aceptada");
      router.push("/equipo");
      router.refresh();
    })();
  }, [sesion, invitationId, router]);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!sesion) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Te invitaron a una empresa</CardTitle>
          <CardDescription>
            Primero crea tu cuenta o inicia sesión; al volver aquí la invitación se acepta sola.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Link href="/registrarse" className={buttonVariants()}>
            Crear cuenta
          </Link>
          <Link href="/iniciar-sesion" className={buttonVariants({ variant: "outline" })}>
            Iniciar sesión
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (estado === "error") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>No se pudo aceptar la invitación</CardTitle>
          <CardDescription role="alert">{detalle}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{estado === "aceptada" ? "Invitación aceptada" : "Aceptando invitación…"}</CardTitle>
        <CardDescription role="status">
          {estado === "aceptada"
            ? "Te llevamos a tu equipo."
            : "Un momento, estamos vinculándote a la empresa."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
