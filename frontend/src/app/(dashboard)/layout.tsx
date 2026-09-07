"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { usuario, cargando, logout } = useAuth();

  if (cargando) {
    return <main className="p-6">Cargando…</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
        <nav className="flex gap-4 text-sm">
          <Link href="/">Dashboard</Link>
          <Link href="/equipos">Equipos</Link>
          <RoleGate rol="supervisor">
            <Link href="/usuarios">Usuarios</Link>
          </RoleGate>
          <Link href="/reportes">Reportes</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {usuario && <span>{usuario.nombre}</span>}
          <button onClick={logout} className="underline">
            Salir
          </button>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
