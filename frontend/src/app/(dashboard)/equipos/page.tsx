"use client";

import Link from "next/link";
import { useState } from "react";

import { EquipoTable } from "@/components/EquipoTable";
import { LoteFilterBar } from "@/components/LoteFilterBar";
import { RoleGate } from "@/components/RoleGate";
import { useEquipos } from "@/hooks/useEquipos";

export default function EquiposPage() {
  const [lote, setLote] = useState<number | undefined>(undefined);
  const { equipos, cargando } = useEquipos(lote);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Equipos</h1>
          <p className="text-sm text-muted">{equipos.length} equipos</p>
        </div>
        <RoleGate rol="supervisor">
          <Link
            href="/equipos/nuevo"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Nuevo equipo
          </Link>
        </RoleGate>
      </div>
      <LoteFilterBar loteSeleccionado={lote} onCambiarLote={setLote} />
      {cargando ? <p className="text-muted">Cargando equipos…</p> : <EquipoTable equipos={equipos} />}
    </div>
  );
}
