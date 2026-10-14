import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "GSI — Gestión de Stock e Inventario",
  description: "SaaS de inventario multi-empresa: qué hay, dónde, cuánto y a qué costo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Tema antes del primer paint para evitar flash (default: preferencia del sistema) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('gsi-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-svh flex flex-col bg-background text-foreground">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
