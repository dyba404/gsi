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

function slugDe(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "empresa"}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function RegistrarsePage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: nombre,
        email,
        password,
      });
      if (signUpError) {
        setError("No se pudo crear la cuenta (¿el email ya está registrado?).");
        return;
      }
      if (empresa.trim()) {
        // T-07: el registro crea la empresa y deja al dueño como member "owner".
        const { data: org, error: orgError } = await authClient.organization.create({
          name: empresa.trim(),
          slug: slugDe(empresa),
        });
        if (orgError || !org) {
          router.push("/sin-empresa");
          return;
        }
        await authClient.organization.setActive({ organizationId: org.id });
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>
            Crea tu empresa para empezar, o regístrate sin empresa si te invitaron a una.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empresa">Empresa (opcional)</Label>
              <Input
                id="empresa"
                placeholder="Deja vacío si te invitaron"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
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
              {cargando ? "Creando…" : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/iniciar-sesion" className="underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
