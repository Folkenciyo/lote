"use client";

import Link from "next/link";

import { IconUsers } from "@/components/icons";
import { EtiquetasConfig } from "@/components/EtiquetasConfig";
import { RoleGate } from "@/components/RoleGate";
import { TareasConfig } from "@/components/TareasConfig";

export default function ConfiguracionPage() {
  return (
    <RoleGate rol="supervisor">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">Configuración</h1>
          <p className="text-sm text-muted">Solo visible para administradores</p>
        </div>

        <Link
          href="/usuarios"
          className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-5 shadow-sm transition-colors hover:bg-background"
        >
          <IconUsers className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Gestión de usuarios</p>
            <p className="text-sm text-muted">Altas, edición de rol/contraseña y bajas</p>
          </div>
        </Link>

        <EtiquetasConfig />

        <TareasConfig />
      </div>
    </RoleGate>
  );
}
