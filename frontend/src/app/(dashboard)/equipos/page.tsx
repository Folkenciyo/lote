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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <LoteFilterBar loteSeleccionado={lote} onCambiarLote={setLote} />
        <RoleGate rol="supervisor">
          <Link href="/equipos/nuevo" className="rounded bg-black px-3 py-1 text-sm text-white">
            Nuevo equipo
          </Link>
        </RoleGate>
      </div>
      {cargando ? <p>Cargando equipos…</p> : <EquipoTable equipos={equipos} />}
    </div>
  );
}
