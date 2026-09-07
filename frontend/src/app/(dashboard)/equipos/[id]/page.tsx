"use client";

import { use } from "react";

import { TareaChecklistItem } from "@/components/TareaChecklistItem";
import { useEstadoEquipo } from "@/hooks/useEstadoEquipo";

export default function EquipoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const equipoId = Number(id);
  const { estados, cargando, recargar } = useEstadoEquipo(equipoId);

  if (cargando) {
    return <p>Cargando estado del equipo…</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-semibold">Equipo #{id}</h1>
      <div className="flex flex-col">
        {estados.map((estadoTarea) => (
          <TareaChecklistItem
            key={estadoTarea.tipo_tarea_id}
            equipoId={equipoId}
            estadoTarea={estadoTarea}
            onRegistrado={recargar}
          />
        ))}
      </div>
    </div>
  );
}
