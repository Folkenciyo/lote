"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { IconDashboard, IconLogout, IconReport, IconTruck, IconUsers } from "@/components/icons";
import { RoleGate } from "@/components/RoleGate";
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
}: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  active: boolean;
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
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { usuario, cargando, logout } = useAuth();
  const pathname = usePathname();

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Cargando…
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <IconTruck className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-white">Mantenimiento de Flota</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}
          <RoleGate rol="supervisor">
            <NavLink
              href="/usuarios"
              label="Usuarios"
              icon={IconUsers}
              active={pathname === "/usuarios"}
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
      <main className="flex-1 overflow-x-hidden p-8">{children}</main>
    </div>
  );
}
