"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { usePlanDiario } from "@/contexts/PlanDiarioContext";
import { apiClient } from "@/lib/apiClient";
import { ESTILOS_COLOR } from "@/lib/coloresEtiqueta";
import { Equipo, EquipoEtiqueta, Estado, EstadoOperativo, EstadoTarea } from "@/types";

const ETIQUETAS_ESTADO: Record<Exclude<EstadoOperativo, "activo">, string> = {
  taller: "En taller",
  averiado: "Averiado",
  baja: "De baja",
};

const ESTILOS_ESTADO: Record<Exclude<EstadoOperativo, "activo">, string> = {
  taller: "bg-amber-100 text-amber-700",
  averiado: "bg-orange-100 text-orange-700",
  baja: "bg-black/10 text-muted",
};

const PUNTO_ESTADO_TAREA: Record<Estado, string> = {
  al_dia: "bg-green-500",
  proximo_a_vencer: "bg-yellow-500",
  vencido: "bg-red-500",
  sin_registro: "bg-gray-400",
};

function FilaActividad({
  equipo,
  estadoTarea,
}: {
  equipo: Equipo;
  estadoTarea: EstadoTarea;
}) {
  const { agregarItems } = usePlanDiario();
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PUNTO_ESTADO_TAREA[estadoTarea.estado]}`} />
        <span className="font-medium">{estadoTarea.tipo_tarea_nombre}</span>
        <span className="text-muted">{estadoTarea.fecha_ultimo_registro ?? "Sin registro"}</span>
      </span>
      <button
        type="button"
        title="Añadir a la lista del día"
        onClick={() =>
          agregarItems([
            {
              equipoId: equipo.id,
              equipoCodigo: equipo.codigo,
              tipoTareaId: estadoTarea.tipo_tarea_id,
              tipoTareaNombre: estadoTarea.tipo_tarea_nombre,
            },
          ])
        }
        className="shrink-0 rounded-full border border-card-border px-1.5 text-primary hover:bg-primary/10"
      >
        +
      </button>
    </div>
  );
}

interface EquipoTableProps {
  equipos: Equipo[];
  seleccionados?: Set<number>;
  onToggleSeleccion?: (equipoId: number) => void;
  mostrarActividad?: boolean;
}

export function EquipoTable({
  equipos,
  seleccionados,
  onToggleSeleccion,
  mostrarActividad,
}: EquipoTableProps) {
  const seleccionable = !!onToggleSeleccion;
  const [estadosPorEquipo, setEstadosPorEquipo] = useState<Record<number, EstadoTarea[]>>({});
  const [etiquetasPorEquipo, setEtiquetasPorEquipo] = useState<Record<number, EquipoEtiqueta[]>>({});

  useEffect(() => {
    if (!mostrarActividad) return;
    let cancelado = false;
    Promise.all(
      equipos.map((equipo) =>
        apiClient
          .get<EstadoTarea[]>(`/estado/equipo/${equipo.id}`)
          .then((estados) => [equipo.id, estados] as const)
      )
    ).then((resultados) => {
      if (cancelado) return;
      setEstadosPorEquipo(Object.fromEntries(resultados));
    });
    Promise.all(
      equipos.map((equipo) =>
        apiClient
          .get<EquipoEtiqueta[]>(`/equipos/${equipo.id}/etiquetas`)
          .then((etiquetas) => [equipo.id, etiquetas] as const)
      )
    ).then((resultados) => {
      if (cancelado) return;
      setEtiquetasPorEquipo(Object.fromEntries(resultados));
    });
    return () => {
      cancelado = true;
    };
  }, [equipos, mostrarActividad]);

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted">
            {seleccionable && <th className="w-10 px-5 py-3" />}
            <th className="px-5 py-3 font-medium">Código</th>
            <th className="px-5 py-3 font-medium">Marca</th>
            <th className="px-5 py-3 font-medium">Modelo</th>
            <th className="px-5 py-3 font-medium">Estado</th>
            {mostrarActividad && (
              <th className="px-5 py-3 font-medium">Actividades (añadir a la lista del día)</th>
            )}
          </tr>
        </thead>
        <tbody>
          {equipos.map((equipo) => (
            <tr key={equipo.id} className="border-t border-card-border/60 hover:bg-background/60">
              {seleccionable && (
                <td className="px-5 py-2.5">
                  <input
                    type="checkbox"
                    checked={seleccionados?.has(equipo.id) ?? false}
                    onChange={() => onToggleSeleccion?.(equipo.id)}
                    className="h-4 w-4 accent-primary"
                    aria-label={`Seleccionar equipo ${equipo.codigo}`}
                  />
                </td>
              )}
              <td className="px-5 py-2.5 align-top">
                <Link href={`/equipos/${equipo.id}`} className="font-medium text-primary hover:underline">
                  {equipo.codigo}
                </Link>
              </td>
              <td className="px-5 py-2.5 align-top">{equipo.marca ?? "-"}</td>
              <td className="px-5 py-2.5 align-top">{equipo.modelo ?? "-"}</td>
              <td className="px-5 py-2.5 align-top">
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      equipo.activo ? "bg-green-100 text-green-700" : "bg-black/5 text-muted"
                    }`}
                  >
                    {equipo.activo ? "Activo" : "Archivado"}
                  </span>
                  {equipo.estado_operativo !== "activo" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTILOS_ESTADO[equipo.estado_operativo]}`}
                    >
                      {ETIQUETAS_ESTADO[equipo.estado_operativo]}
                    </span>
                  )}
                  {mostrarActividad &&
                    (etiquetasPorEquipo[equipo.id] ?? []).map((asignacion) => (
                      <span
                        key={asignacion.id}
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ESTILOS_COLOR[asignacion.etiqueta.color]}`}
                      >
                        {asignacion.etiqueta.nombre}
                      </span>
                    ))}
                </div>
              </td>
              {mostrarActividad && (
                <td className="min-w-[16rem] px-5 py-2.5 align-top">
                  <div className="flex flex-col gap-1">
                    {(estadosPorEquipo[equipo.id] ?? []).map((estadoTarea) => (
                      <FilaActividad
                        key={estadoTarea.tipo_tarea_id}
                        equipo={equipo}
                        estadoTarea={estadoTarea}
                      />
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
