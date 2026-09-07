"use client";

import { MetricCard } from "@/components/MetricCard";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { resumen, cargando } = useDashboard();

  if (cargando || !resumen) {
    return <p>Cargando métricas…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard titulo="Equipos activos" valor={resumen.total_equipos} />
        <MetricCard titulo="Tareas vencidas" valor={resumen.total_vencidos} />
        <MetricCard titulo="Próximas a vencer" valor={resumen.total_proximos_a_vencer} />
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10">
            <th className="py-2">Lote</th>
            <th className="py-2">Equipos</th>
            <th className="py-2">Vencidos</th>
            <th className="py-2">Próximos</th>
            <th className="py-2">% Cumplimiento</th>
          </tr>
        </thead>
        <tbody>
          {resumen.por_lote.map((lote) => (
            <tr key={lote.lote} className="border-b border-black/5">
              <td className="py-2">{lote.lote}</td>
              <td className="py-2">{lote.total_equipos}</td>
              <td className="py-2">{lote.vencidos}</td>
              <td className="py-2">{lote.proximos_a_vencer}</td>
              <td className="py-2">{lote.porcentaje_cumplimiento}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
