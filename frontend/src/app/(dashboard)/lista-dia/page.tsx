"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EstadoOperativoBadge } from "@/components/EstadoOperativoBadge";
import { PlanDiarioItemRow } from "@/components/PlanDiarioItemRow";
import { usePlanDiario } from "@/contexts/PlanDiarioContext";
import { apiClient } from "@/lib/apiClient";
import { ESTILOS_COLOR } from "@/lib/coloresEtiqueta";
import { PlanDiarioItem } from "@/lib/planDiario";
import { ResumenEquipo } from "@/types";

function agruparPorEquipo(items: PlanDiarioItem[]): Map<number, PlanDiarioItem[]> {
  const grupos = new Map<number, PlanDiarioItem[]>();
  for (const item of items) {
    const grupo = grupos.get(item.equipoId) ?? [];
    grupo.push(item);
    grupos.set(item.equipoId, grupo);
  }
  return grupos;
}

function CabeceraEquipo({
  equipoId,
  equipoCodigo,
  resumen,
}: {
  equipoId: number;
  equipoCodigo: string;
  resumen: ResumenEquipo | undefined;
}) {
  const vencidas = resumen?.estados.filter((e) => e.estado === "vencido").length ?? 0;
  const proximas = resumen?.estados.filter((e) => e.estado === "proximo_a_vencer").length ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-card-border px-5 py-3">
      <Link href={`/equipos/${equipoId}`} className="font-medium text-primary hover:underline">
        Equipo {equipoCodigo}
      </Link>
      {resumen && (
        <>
          <EstadoOperativoBadge estado={resumen.estado_operativo} />
          {resumen.etiquetas.map((asignacion) => (
            <span
              key={asignacion.id}
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ESTILOS_COLOR[asignacion.etiqueta.color]}`}
            >
              {asignacion.etiqueta.nombre}
            </span>
          ))}
          {vencidas > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {vencidas} vencida{vencidas === 1 ? "" : "s"}
            </span>
          )}
          {proximas > 0 && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              {proximas} próxima{proximas === 1 ? "" : "s"} a vencer
            </span>
          )}
        </>
      )}
    </div>
  );
}

export default function ListaDelDiaPage() {
  const { items, alternarHecho, quitarItem, limpiarHechas } = usePlanDiario();
  const [resumenPorEquipo, setResumenPorEquipo] = useState<Record<number, ResumenEquipo>>({});
  const grupos = agruparPorEquipo(items);
  const hayHechas = items.some((item) => item.hecho);

  const cargarResumen = useCallback(async (equipoIds: number[]) => {
    if (equipoIds.length === 0) return;
    const resumenes = await apiClient.get<ResumenEquipo[]>(
      `/equipos/resumen?ids=${equipoIds.join(",")}`
    );
    setResumenPorEquipo((actuales) => ({
      ...actuales,
      ...Object.fromEntries(resumenes.map((resumen) => [resumen.equipo_id, resumen])),
    }));
  }, []);

  useEffect(() => {
    const equipoIds = [...new Set(items.map((item) => item.equipoId))];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarResumen(equipoIds.filter((id) => !(id in resumenPorEquipo)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, cargarResumen]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Lista del día</h1>
          <p className="text-sm text-muted">
            Plan personal de tareas para hoy, guardado solo en este navegador. &ldquo;Marcar
            realizado&rdquo; registra la tarea de verdad, igual que desde la ficha del equipo.
          </p>
        </div>
        {hayHechas && (
          <button
            onClick={limpiarHechas}
            className="shrink-0 rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-card"
          >
            Quitar hechas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted">
          Sin tareas planificadas. Búscalas en{" "}
          <Link href="/equipos" className="text-primary hover:underline">
            Equipos
          </Link>{" "}
          y añádelas a la lista del día.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {[...grupos.entries()].map(([equipoId, itemsEquipo]) => (
            <div key={equipoId} className="rounded-xl border border-card-border bg-card shadow-sm">
              <CabeceraEquipo
                equipoId={equipoId}
                equipoCodigo={itemsEquipo[0].equipoCodigo}
                resumen={resumenPorEquipo[equipoId]}
              />
              <div className="flex flex-col">
                {itemsEquipo.map((item) => (
                  <PlanDiarioItemRow
                    key={item.id}
                    item={item}
                    estadoTarea={resumenPorEquipo[equipoId]?.estados.find(
                      (estado) => estado.tipo_tarea_id === item.tipoTareaId
                    )}
                    onHecho={() => {
                      alternarHecho(item.id);
                      cargarResumen([equipoId]);
                    }}
                    onQuitar={() => quitarItem(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
