"use client";

import { FormEvent, useState } from "react";

import { EstadoBadge } from "@/components/EstadoBadge";
import { apiClient, ApiError } from "@/lib/apiClient";
import { EstadoTarea } from "@/types";

export function TareaChecklistItem({
  equipoId,
  estadoTarea,
  onRegistrado,
}: {
  equipoId: number;
  estadoTarea: EstadoTarea;
  onRegistrado: () => void;
}) {
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const marcarRealizado = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    setGuardado(false);
    try {
      await apiClient.post("/registros", {
        equipo_id: equipoId,
        tipo_tarea_id: estadoTarea.tipo_tarea_id,
        fecha_realizada: new Date().toISOString().slice(0, 10),
        observaciones: observaciones || null,
      });
      setObservaciones("");
      onRegistrado();
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar la tarea");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={marcarRealizado}
      className="flex flex-wrap items-center justify-between gap-4 border-b border-card-border/60 px-5 py-4 last:border-b-0"
    >
      <div className="flex flex-col gap-1.5">
        <p className="font-medium">{estadoTarea.tipo_tarea_nombre}</p>
        <EstadoBadge estado={estadoTarea.estado} />
        {estadoTarea.fecha_ultimo_registro && (
          <p className="text-xs text-muted">Último: {estadoTarea.fecha_ultimo_registro}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Observaciones"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Marcar realizado
        </button>
        {guardado && <span className="text-sm text-green-700">✓ Guardado</span>}
      </div>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
