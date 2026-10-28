"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EstadoOperativoBadge } from "@/components/EstadoOperativoBadge";
import { ObservacionAviso } from "@/components/ObservacionAviso";
import { usePlanDiario } from "@/contexts/PlanDiarioContext";
import { apiClient } from "@/lib/apiClient";
import { ESTILOS_COLOR } from "@/lib/coloresEtiqueta";
import { Equipo, Estado, EstadoTarea, Registro, ResumenEquipo } from "@/types";

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
  const { agregarItems, estaEnLista } = usePlanDiario();
  const enLista = estaEnLista(equipo.id, estadoTarea.tipo_tarea_id);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PUNTO_ESTADO_TAREA[estadoTarea.estado]}`} />
          <span className="font-medium">{estadoTarea.tipo_tarea_nombre}</span>
          <span className="text-muted">{estadoTarea.fecha_ultimo_registro ?? "Sin registro"}</span>
        </span>
        <button
          type="button"
          title={enLista ? "Ya está en la lista del día" : "Añadir a la lista del día"}
          aria-label={enLista ? "Ya está en la lista del día" : "Añadir a la lista del día"}
          disabled={enLista}
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
          className={`shrink-0 rounded-full border px-1.5 ${
            enLista
              ? "border-green-300 bg-green-100 text-green-700"
              : "border-card-border text-primary hover:bg-primary/10"
          }`}
        >
          {enLista ? "✓" : "+"}
        </button>
      </div>
      {estadoTarea.observaciones_ultimo_registro && (
        <div className="pl-3">
          <ObservacionAviso texto={estadoTarea.observaciones_ultimo_registro} />
        </div>
      )}
    </div>
  );
}

function UltimasObservaciones({
  equipoId,
  observaciones,
}: {
  equipoId: number;
  observaciones: Registro[];
}) {
  if (observaciones.length === 0) return null;
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer font-medium text-amber-700">
        Últimas observaciones ({observaciones.length})
      </summary>
      <ul className="mt-1 flex flex-col gap-1.5 border-l-2 border-amber-200 pl-2">
        {observaciones.map((registro) => (
          <li key={registro.id}>
            <span className="text-muted">
              {registro.fecha_realizada} · {registro.tipo_tarea_nombre} · {registro.usuario_nombre}
            </span>
            <p>{registro.observaciones}</p>
          </li>
        ))}
      </ul>
      <Link href={`/equipos/${equipoId}`} className="mt-1 inline-block text-primary hover:underline">
        Ver todas en la ficha
      </Link>
    </details>
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
  const [resumenPorEquipo, setResumenPorEquipo] = useState<Record<number, ResumenEquipo>>({});

  useEffect(() => {
    if (!mostrarActividad || equipos.length === 0) return;
    let cancelado = false;
    const ids = equipos.map((equipo) => equipo.id).join(",");
    apiClient.get<ResumenEquipo[]>(`/equipos/resumen?ids=${ids}`).then((resumenes) => {
      if (cancelado) return;
      setResumenPorEquipo(Object.fromEntries(resumenes.map((r) => [r.equipo_id, r])));
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
                    <EstadoOperativoBadge estado={equipo.estado_operativo} />
                  )}
                  {mostrarActividad &&
                    (resumenPorEquipo[equipo.id]?.etiquetas ?? []).map((asignacion) => (
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
                    {(resumenPorEquipo[equipo.id]?.estados ?? []).map((estadoTarea) => (
                      <FilaActividad
                        key={estadoTarea.tipo_tarea_id}
                        equipo={equipo}
                        estadoTarea={estadoTarea}
                      />
                    ))}
                    <UltimasObservaciones
                      equipoId={equipo.id}
                      observaciones={resumenPorEquipo[equipo.id]?.observaciones ?? []}
                    />
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
