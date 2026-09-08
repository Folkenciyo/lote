"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { Registro } from "@/types";

export function HistorialEquipo({ equipoId, refreshKey }: { equipoId: number; refreshKey: number }) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    apiClient.get<Registro[]>(`/registros?equipo_id=${equipoId}`).then((data) => {
      if (activo) {
        setRegistros(data);
        setCargando(false);
      }
    });
    return () => {
      activo = false;
    };
  }, [equipoId, refreshKey]);

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Historial de mantenimiento</h2>
      </div>
      {cargando ? (
        <p className="p-5 text-sm text-muted">Cargando historial…</p>
      ) : registros.length === 0 ? (
        <p className="p-5 text-sm text-muted">Todavía no hay registros para este equipo.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium">Tarea</th>
                <th className="px-5 py-2 font-medium">Registrado por</th>
                <th className="px-5 py-2 font-medium">Horas</th>
                <th className="px-5 py-2 font-medium">Km</th>
                <th className="px-5 py-2 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id} className="border-t border-card-border/60">
                  <td className="px-5 py-2.5">{registro.fecha_realizada}</td>
                  <td className="px-5 py-2.5">{registro.tipo_tarea_nombre}</td>
                  <td className="px-5 py-2.5 font-medium">{registro.usuario_nombre}</td>
                  <td className="px-5 py-2.5 text-muted">{registro.horas_trabajo ?? "-"}</td>
                  <td className="px-5 py-2.5 text-muted">{registro.kilometros ?? "-"}</td>
                  <td className="px-5 py-2.5 text-muted">{registro.observaciones ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
