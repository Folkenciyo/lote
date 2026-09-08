"use client";

import { FormEvent, useState } from "react";

import { apiClient, ApiError } from "@/lib/apiClient";
import { Equipo } from "@/types";

export function LecturaActualEquipo({
  equipo,
  onActualizado,
}: {
  equipo: Equipo;
  onActualizado: (equipo: Equipo) => void;
}) {
  const [horas, setHoras] = useState(equipo.lectura_actual_horas?.toString() ?? "");
  const [km, setKm] = useState(equipo.lectura_actual_km?.toString() ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const actualizado = await apiClient.patch<Equipo>(`/equipos/${equipo.id}/lectura`, {
        lectura_actual_horas: horas ? Number(horas) : null,
        lectura_actual_km: km ? Number(km) : null,
      });
      onActualizado(actualizado);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar la lectura");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Lectura actual del vehículo</h2>
        <p className="text-sm text-muted">
          Horómetro/cuentakilómetros a día de hoy — cualquiera puede actualizarla
        </p>
      </div>
      <form onSubmit={guardar} className="flex flex-wrap items-end gap-2 p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Horas actuales</label>
          <input
            type="number"
            value={horas}
            onChange={(event) => setHoras(event.target.value)}
            className="w-32 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Km actuales</label>
          <input
            type="number"
            value={km}
            onChange={(event) => setKm(event.target.value)}
            className="w-32 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Guardar lectura
        </button>
        {guardado && <span className="text-sm text-green-700">✓ Guardado</span>}
        {error && (
          <p role="alert" className="w-full text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
