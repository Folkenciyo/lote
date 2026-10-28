"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { Registro } from "@/types";

export function ObservacionesEquipo({
  equipoId,
  refreshKey,
}: {
  equipoId: number;
  refreshKey: number;
}) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    apiClient
      .get<Registro[]>(`/registros?equipo_id=${equipoId}&con_observaciones=true`)
      .then((data) => {
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
      <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Observaciones / fallos</h2>
        {!cargando && registros.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {registros.length}
          </span>
        )}
      </div>
      {cargando ? (
        <p className="p-5 text-sm text-muted">Cargando observaciones…</p>
      ) : registros.length === 0 ? (
        <p className="p-5 text-sm text-muted">No hay observaciones escritas para este equipo.</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {registros.map((registro) => (
            <li
              key={registro.id}
              className="flex flex-col gap-0.5 border-t border-card-border/60 px-5 py-2.5 first:border-t-0"
            >
              <span className="text-xs text-muted">
                {registro.fecha_realizada} · {registro.tipo_tarea_nombre} · {registro.usuario_nombre}
              </span>
              <span className="text-sm">{registro.observaciones}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
