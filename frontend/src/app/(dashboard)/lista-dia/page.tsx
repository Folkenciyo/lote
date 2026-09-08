"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PlanDiarioItemRow } from "@/components/PlanDiarioItemRow";
import { usePlanDiario } from "@/contexts/PlanDiarioContext";
import { apiClient } from "@/lib/apiClient";
import { PlanDiarioItem } from "@/lib/planDiario";
import { EstadoTarea } from "@/types";

function agruparPorEquipo(items: PlanDiarioItem[]): Map<number, PlanDiarioItem[]> {
  const grupos = new Map<number, PlanDiarioItem[]>();
  for (const item of items) {
    const grupo = grupos.get(item.equipoId) ?? [];
    grupo.push(item);
    grupos.set(item.equipoId, grupo);
  }
  return grupos;
}

export default function ListaDelDiaPage() {
  const { items, alternarHecho, quitarItem, limpiarHechas } = usePlanDiario();
  const [estadosPorEquipo, setEstadosPorEquipo] = useState<Record<number, EstadoTarea[]>>({});
  const grupos = agruparPorEquipo(items);
  const hayHechas = items.some((item) => item.hecho);

  const cargarEstadoEquipo = useCallback(async (equipoId: number) => {
    const estados = await apiClient.get<EstadoTarea[]>(`/estado/equipo/${equipoId}`);
    setEstadosPorEquipo((actuales) => ({ ...actuales, [equipoId]: estados }));
  }, []);

  useEffect(() => {
    const equipoIds = [...new Set(items.map((item) => item.equipoId))];
    const faltantes = equipoIds.filter((id) => !(id in estadosPorEquipo));
    faltantes.forEach((id) => {
      cargarEstadoEquipo(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, cargarEstadoEquipo]);

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
              <div className="border-b border-card-border px-5 py-3">
                <Link
                  href={`/equipos/${equipoId}`}
                  className="font-medium text-primary hover:underline"
                >
                  Equipo {itemsEquipo[0].equipoCodigo}
                </Link>
              </div>
              <div className="flex flex-col">
                {itemsEquipo.map((item) => (
                  <PlanDiarioItemRow
                    key={item.id}
                    item={item}
                    estadoTarea={estadosPorEquipo[equipoId]?.find(
                      (estado) => estado.tipo_tarea_id === item.tipoTareaId
                    )}
                    onHecho={() => {
                      alternarHecho(item.id);
                      cargarEstadoEquipo(equipoId);
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
