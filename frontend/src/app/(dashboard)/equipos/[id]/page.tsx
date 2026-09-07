"use client";

import { use, useCallback, useEffect, useState } from "react";

import { CompartirEquipo } from "@/components/CompartirEquipo";
import { EquipoInfoForm } from "@/components/EquipoInfoForm";
import { HistorialEquipo } from "@/components/HistorialEquipo";
import { TareaChecklistItem } from "@/components/TareaChecklistItem";
import { useEstadoEquipo } from "@/hooks/useEstadoEquipo";
import { apiClient } from "@/lib/apiClient";
import { Equipo } from "@/types";

export default function EquipoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const equipoId = Number(id);
  const { estados, cargando, recargar } = useEstadoEquipo(equipoId);
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [historialKey, setHistorialKey] = useState(0);

  const cargarEquipo = useCallback(async () => {
    const data = await apiClient.get<Equipo>(`/equipos/${equipoId}`);
    setEquipo(data);
  }, [equipoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarEquipo();
  }, [cargarEquipo]);

  const alRegistrar = () => {
    recargar();
    setHistorialKey((k) => k + 1);
  };

  if (cargando || !equipo) {
    return <p className="text-muted">Cargando equipo…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Equipo {equipo.codigo}</h1>
          <p className="text-sm text-muted">Lote {equipo.lote}</p>
        </div>
        <CompartirEquipo equipo={equipo} />
      </div>

      <EquipoInfoForm equipo={equipo} onActualizado={setEquipo} />

      <div className="rounded-xl border border-card-border bg-card shadow-sm">
        <div className="border-b border-card-border px-5 py-4">
          <h2 className="font-medium">Tareas de mantenimiento</h2>
        </div>
        <div className="flex flex-col">
          {estados.map((estadoTarea) => (
            <TareaChecklistItem
              key={estadoTarea.tipo_tarea_id}
              equipoId={equipoId}
              estadoTarea={estadoTarea}
              onRegistrado={alRegistrar}
            />
          ))}
        </div>
      </div>

      <HistorialEquipo equipoId={equipoId} refreshKey={historialKey} />
    </div>
  );
}
