"use client";

import { useState } from "react";

import { IconAlert } from "@/components/icons";
import { useAvisoMantenimiento } from "@/hooks/useAvisoMantenimiento";
import { AvisoCategoria } from "@/types";

function LineaAviso({ aviso, etiqueta }: { aviso: AvisoCategoria; etiqueta: string }) {
  if (aviso.total_vencidos === 0) return null;
  return (
    <p>
      <span className="font-medium">
        {aviso.total_vencidos} vehículo{aviso.total_vencidos === 1 ? "" : "s"} con{" "}
        {etiqueta}
      </span>
      : {aviso.codigos_equipos.join(", ")}
    </p>
  );
}

export function AvisoMantenimientoBanner() {
  const { avisos, cargando } = useAvisoMantenimiento();
  const [oculto, setOculto] = useState(false);

  const hayAvisos =
    avisos && (avisos.mantenimiento.total_vencidos > 0 || avisos.engrase.total_vencidos > 0);

  if (cargando || !hayAvisos || oculto) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:px-6">
      <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 flex flex-col gap-1">
        <LineaAviso aviso={avisos.mantenimiento} etiqueta="mantenimiento vencido (revisión semestral)" />
        <LineaAviso aviso={avisos.engrase} etiqueta="engrase vencido (revisión mensual)" />
      </div>
      <button
        onClick={() => setOculto(true)}
        className="shrink-0 text-red-700 hover:text-red-900"
        aria-label="Ocultar aviso"
      >
        ✕
      </button>
    </div>
  );
}
