"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/productos", label: "Productos" },
  { href: "/movimientos/nuevo", label: "Movimiento" },
  { href: "/equipo", label: "Equipo" },
];

export function NavApp({ nombreOrg, rol }: { nombreOrg: string; rol: string }) {
  const router = useRouter();
  async function salir() {
    await authClient.signOut();
    router.push("/iniciar-sesion");
    router.refresh();
  }
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          GSI <span className="text-muted-foreground">· {nombreOrg}</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="hidden text-xs text-muted-foreground sm:inline">{rol}</span>
        <Button variant="ghost" size="sm" onClick={salir}>
          Salir
        </Button>
      </div>
    </header>
  );
}
