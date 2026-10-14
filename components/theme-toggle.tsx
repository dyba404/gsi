"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function ThemeIcon({ modo }: { modo: "claro" | "oscuro" }) {
  return modo === "oscuro" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [montado, setMontado] = useState(false);
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    setMontado(true);
    setOscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    document.documentElement.classList.toggle("dark", nuevo);
    try {
      localStorage.setItem("gsi-theme", nuevo ? "dark" : "light");
    } catch {}
  }

  if (!montado) return null;
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      onClick={alternar}
      className="rounded-full"
    >
      <ThemeIcon modo={oscuro ? "oscuro" : "claro"} />
    </Button>
  );
}
