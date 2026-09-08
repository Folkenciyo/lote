"use client";

import { useCallback, useEffect, useState } from "react";

import { RoleGate } from "@/components/RoleGate";
import { ESTILOS_COLOR } from "@/lib/coloresEtiqueta";
import { apiClient, ApiError } from "@/lib/apiClient";
import { EquipoEtiqueta, Etiqueta } from "@/types";

export function EtiquetasEquipo({ equipoId }: { equipoId: number }) {
  const [asignadas, setAsignadas] = useState<EquipoEtiqueta[]>([]);
  const [catalogo, setCatalogo] = useState<Etiqueta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [equipoEtiquetas, todas] = await Promise.all([
      apiClient.get<EquipoEtiqueta[]>(`/equipos/${equipoId}/etiquetas`),
      apiClient.get<Etiqueta[]>("/etiquetas"),
    ]);
    setAsignadas(equipoEtiquetas);
    setCatalogo(todas);
    setCargando(false);
  }, [equipoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const disponibles = catalogo.filter(
    (etiqueta) => !asignadas.some((a) => a.etiqueta.id === etiqueta.id)
  );

  const asignar = async () => {
    if (!etiquetaSeleccionada) return;
    setEnviando(true);
    setError(null);
    try {
      await apiClient.post(`/equipos/${equipoId}/etiquetas`, {
        etiqueta_id: Number(etiquetaSeleccionada),
      });
      setEtiquetaSeleccionada("");
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al añadir la etiqueta");
    } finally {
      setEnviando(false);
    }
  };

  const quitar = async (etiquetaId: number) => {
    setError(null);
    try {
      await apiClient.delete(`/equipos/${equipoId}/etiquetas/${etiquetaId}`);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al quitar la etiqueta");
    }
  };

  if (cargando) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Etiquetas</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2 p-5">
        {asignadas.length === 0 && <p className="text-sm text-muted">Sin etiquetas.</p>}
        {asignadas.map((asignacion) => (
          <span
            key={asignacion.id}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${ESTILOS_COLOR[asignacion.etiqueta.color]}`}
          >
            {asignacion.etiqueta.nombre}
            <RoleGate rol="supervisor">
              <button
                onClick={() => quitar(asignacion.etiqueta.id)}
                aria-label={`Quitar etiqueta ${asignacion.etiqueta.nombre}`}
                className="hover:opacity-60"
              >
                ✕
              </button>
            </RoleGate>
          </span>
        ))}
      </div>
      <RoleGate rol="supervisor">
        {disponibles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-card-border px-5 py-4">
            <select
              value={etiquetaSeleccionada}
              onChange={(event) => setEtiquetaSeleccionada(event.target.value)}
              className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Añadir etiqueta…</option>
              {disponibles.map((etiqueta) => (
                <option key={etiqueta.id} value={etiqueta.id}>
                  {etiqueta.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={asignar}
              disabled={enviando || !etiquetaSeleccionada}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              Añadir
            </button>
            {error && (
              <p role="alert" className="w-full text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
      </RoleGate>
    </div>
  );
}
