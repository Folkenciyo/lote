"use client";

import { useEffect, useState } from "react";

import { usePlanDiario } from "@/contexts/PlanDiarioContext";
import { apiClient } from "@/lib/apiClient";
import { Equipo, EstadoTarea } from "@/types";

const ESTADOS_PRESELECCIONADOS = new Set(["vencido", "proximo_a_vencer"]);

interface TareaSeleccionable {
  equipoId: number;
  equipoCodigo: string;
  tipoTareaId: number;
  tipoTareaNombre: string;
  estado: EstadoTarea["estado"];
}

export function PlanificarTareasModal({
  equipos,
  onClose,
}: {
  equipos: Equipo[];
  onClose: () => void;
}) {
  const { agregarItems } = usePlanDiario();
  const [cargando, setCargando] = useState(true);
  const [tareas, setTareas] = useState<TareaSeleccionable[]>([]);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      const resultados = await Promise.all(
        equipos.map(async (equipo) => {
          const estados = await apiClient.get<EstadoTarea[]>(`/estado/equipo/${equipo.id}`);
          return estados.map((estadoTarea) => ({
            equipoId: equipo.id,
            equipoCodigo: equipo.codigo,
            tipoTareaId: estadoTarea.tipo_tarea_id,
            tipoTareaNombre: estadoTarea.tipo_tarea_nombre,
            estado: estadoTarea.estado,
          }));
        })
      );
      if (cancelado) return;
      const todas = resultados.flat();
      setTareas(todas);
      setMarcadas(
        new Set(
          todas
            .filter((tarea) => ESTADOS_PRESELECCIONADOS.has(tarea.estado))
            .map((tarea) => `${tarea.equipoId}:${tarea.tipoTareaId}`)
        )
      );
      setCargando(false);
    }
    cargar();
    return () => {
      cancelado = true;
    };
  }, [equipos]);

  const alternar = (id: string) => {
    setMarcadas((actuales) => {
      const nuevas = new Set(actuales);
      if (nuevas.has(id)) {
        nuevas.delete(id);
      } else {
        nuevas.add(id);
      }
      return nuevas;
    });
  };

  const confirmar = () => {
    const seleccionadas = tareas.filter((tarea) =>
      marcadas.has(`${tarea.equipoId}:${tarea.tipoTareaId}`)
    );
    agregarItems(
      seleccionadas.map((tarea) => ({
        equipoId: tarea.equipoId,
        equipoCodigo: tarea.equipoCodigo,
        tipoTareaId: tarea.tipoTareaId,
        tipoTareaNombre: tarea.tipoTareaNombre,
      }))
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h2 className="font-medium">Planificar tareas para {equipos.length} equipos</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-muted hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cargando ? (
            <p className="text-muted">Cargando tareas…</p>
          ) : (
            <div className="flex flex-col gap-4">
              {equipos.map((equipo) => {
                const tareasEquipo = tareas.filter((tarea) => tarea.equipoId === equipo.id);
                if (tareasEquipo.length === 0) return null;
                return (
                  <div key={equipo.id}>
                    <p className="mb-1.5 text-sm font-medium">Equipo {equipo.codigo}</p>
                    <div className="flex flex-col gap-1">
                      {tareasEquipo.map((tarea) => {
                        const id = `${tarea.equipoId}:${tarea.tipoTareaId}`;
                        return (
                          <label key={id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={marcadas.has(id)}
                              onChange={() => alternar(id)}
                              className="h-4 w-4 accent-primary"
                            />
                            {tarea.tipoTareaNombre}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-card-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-background"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={cargando || marcadas.size === 0}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            Añadir {marcadas.size} tarea{marcadas.size === 1 ? "" : "s"} a la lista del día
          </button>
        </div>
      </div>
    </div>
  );
}
