"use client";

import { IconAlert, IconClock, IconTruck } from "@/components/icons";
import { MetricCard } from "@/components/MetricCard";
import { useActividad } from "@/hooks/useActividad";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { resumen, cargando } = useDashboard();
  const { actividad, cargando: cargandoActividad } = useActividad();

  if (cargando || !resumen) {
    return <p className="text-muted">Cargando métricas…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Estado general de la flota</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          titulo="Equipos activos"
          valor={resumen.total_equipos}
          icono={<IconTruck className="h-5 w-5" />}
        />
        <MetricCard
          titulo="Tareas vencidas"
          valor={resumen.total_vencidos}
          icono={<IconAlert className="h-5 w-5" />}
          tono="rojo"
        />
        <MetricCard
          titulo="Próximas a vencer"
          valor={resumen.total_proximos_a_vencer}
          icono={<IconClock className="h-5 w-5" />}
          tono="ambar"
        />
        <MetricCard titulo="% Cumplimiento" valor={`${resumen.porcentaje_cumplimiento}%`} />
      </div>

      <div className="rounded-xl border border-card-border bg-card shadow-sm">
        <div className="border-b border-card-border px-5 py-4">
          <h2 className="font-medium">Actividad por técnico</h2>
          <p className="text-sm text-muted">Quién ha registrado mantenimientos y cuántos</p>
        </div>
        {cargandoActividad ? (
          <p className="p-5 text-sm text-muted">Cargando…</p>
        ) : actividad.length === 0 ? (
          <p className="p-5 text-sm text-muted">Todavía no hay registros de mantenimiento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="px-5 py-2 font-medium">Técnico</th>
                  <th className="px-5 py-2 font-medium">Registros</th>
                  <th className="px-5 py-2 font-medium">Último registro</th>
                </tr>
              </thead>
              <tbody>
                {actividad.map((a) => (
                  <tr key={a.usuario_id} className="border-t border-card-border/60">
                    <td className="px-5 py-2.5 font-medium">{a.nombre}</td>
                    <td className="px-5 py-2.5">{a.total_registros}</td>
                    <td className="px-5 py-2.5 text-muted">{a.ultimo_registro ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
