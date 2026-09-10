"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

import { AvisoMantenimientoBanner } from "@/components/AvisoMantenimientoBanner";
import {
  IconChecklist,
  IconClose,
  IconDashboard,
  IconLogout,
  IconMenu,
  IconReport,
  IconSettings,
  IconTruck,
  IconUsers,
} from "@/components/icons";
import { RoleGate } from "@/components/RoleGate";
import { PlanDiarioProvider, usePlanDiario } from "@/contexts/PlanDiarioContext";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/equipos", label: "Equipos", icon: IconTruck },
  { href: "/reportes", label: "Reportes", icon: IconReport },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-sidebar-active text-white"
          : "text-sidebar-foreground hover:bg-sidebar-active hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function ListaDelDiaNavLink({ active }: { active: boolean }) {
  const { items } = usePlanDiario();
  const pendientes = items.filter((item) => !item.hecho).length;
  return (
    <NavLink
      href="/lista-dia"
      label="Lista del día"
      icon={IconChecklist}
      active={active}
      badge={pendientes}
    />
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { usuario, cargando, logout } = useAuth();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);

  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setMenuAbierto(false);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Cargando…
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col bg-sidebar px-4 py-6 transition-transform duration-200 lg:static lg:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <IconTruck className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-white">Mantenimiento de Flota</span>
          </div>
          <button
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
            className="text-sidebar-foreground hover:text-white lg:hidden"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}
          <ListaDelDiaNavLink active={pathname === "/lista-dia"} />
          <RoleGate rol="supervisor">
            <NavLink
              href="/usuarios"
              label="Usuarios"
              icon={IconUsers}
              active={pathname === "/usuarios"}
            />
            <NavLink
              href="/configuracion"
              label="Configuración"
              icon={IconSettings}
              active={pathname === "/configuracion"}
            />
          </RoleGate>
        </nav>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
          {usuario && (
            <div className="px-2">
              <p className="truncate text-sm font-medium text-white">{usuario.nombre}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">{usuario.rol}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-active hover:text-white"
          >
            <IconLogout className="h-5 w-5" />
            Salir
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="flex items-center gap-3 border-b border-card-border bg-card px-4 py-3 lg:hidden">
          <button
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-1.5 text-foreground hover:bg-background"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">Mantenimiento de Flota</span>
        </header>
        <AvisoMantenimientoBanner />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PlanDiarioProvider>
      <DashboardShell>{children}</DashboardShell>
    </PlanDiarioProvider>
  );
}
