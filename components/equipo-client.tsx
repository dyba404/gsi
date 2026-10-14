"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ETIQUETA_ROL, puede, ROLES, type Role } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Miembro = {
  id: string;
  userId: string;
  role: string;
  user?: { name?: string; email?: string } | null;
};

export function MiembrosEquipo({
  orgId,
  rol,
  sesionUserId,
}: {
  orgId: string;
  rol: Role;
  sesionUserId: string;
}) {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [nombreOrg, setNombreOrg] = useState("");
  const [emailInvitar, setEmailInvitar] = useState("");
  const [rolInvitar, setRolInvitar] = useState<Role>("almacen");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await authClient.organization.getFullOrganization({
      query: { organizationId: orgId },
    });
    if (!error && data) {
      setNombreOrg(data.name);
      setMiembros((data.members ?? []) as Miembro[]);
    }
    setCargando(false);
  }, [orgId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setError(null);
    const { error: err } = await authClient.organization.inviteMember({
      email: emailInvitar,
      role: rolInvitar,
      organizationId: orgId,
    });
    if (err) {
      setError("No se pudo invitar (¿email ya invitado o ya es miembro?).");
      return;
    }
    setMensaje(`Invitación enviada a ${emailInvitar} como ${ETIQUETA_ROL[rolInvitar]}.`);
    setEmailInvitar("");
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{nombreOrg || "Cargando…"}</CardTitle>
          <CardDescription>
            {miembros.length} {miembros.length === 1 ? "miembro" : "miembros"} · tu rol:{" "}
            <Badge variant="secondary">{ETIQUETA_ROL[rol]}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando miembros…</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {miembros.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.user?.name ?? "(sin nombre)"}</p>
                    <p className="truncate text-sm text-muted-foreground">{m.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.userId === sesionUserId && <span className="text-xs text-muted-foreground">tú</span>}
                    <Badge variant="outline">{ETIQUETA_ROL[m.role as Role] ?? m.role}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {puede(rol, "equipo:invitar") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invitar al equipo</CardTitle>
            <CardDescription>
              El link de invitación se genera en el log del servidor (transport de dev).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={invitar} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="email-invitar">Email a invitar</Label>
                <Input
                  id="email-invitar"
                  type="email"
                  required
                  value={emailInvitar}
                  onChange={(e) => setEmailInvitar(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rol-invitar">Rol</Label>
                <Select value={rolInvitar} onValueChange={(v) => setRolInvitar(v as Role)}>
                  <SelectTrigger id="rol-invitar" className="w-36">
                    <SelectValue>{ETIQUETA_ROL[rolInvitar]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((r) => r !== "owner").map((r) => (
                      <SelectItem key={r} value={r}>
                        {ETIQUETA_ROL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Invitar</Button>
            </form>
            {mensaje && (
              <p role="status" className="mt-3 text-sm text-green-600 dark:text-green-400">
                {mensaje}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Tu rol ({ETIQUETA_ROL[rol]}) no puede invitar personas. Pídele al administrador.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
