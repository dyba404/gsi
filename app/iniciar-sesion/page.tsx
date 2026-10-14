"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function IniciarSesionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await authClient.signIn.email({ email, password });
    setCargando(false);
    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    // Sesión nueva = sin organización activa: activar la primera membresía del usuario.
    const { data: orgs } = await authClient.organization.list();
    if (orgs && orgs.length > 0) {
      await authClient.organization.setActive({ organizationId: orgs[0].id });
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Entra a tu sistema de inventario.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={cargando}>
              {cargando ? "Entrando…" : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registrarse" className="underline underline-offset-4">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
