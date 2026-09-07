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

  const marcarRealizado = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await apiClient.post("/registros", {
        equipo_id: equipoId,
        tipo_tarea_id: estadoTarea.tipo_tarea_id,
        fecha_realizada: new Date().toISOString().slice(0, 10),
        observaciones: observaciones || null,
      });
      setObservaciones("");
      onRegistrado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar la tarea");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={marcarRealizado}
      className="flex items-center justify-between gap-4 border-b border-black/5 py-3"
    >
      <div>
        <p className="font-medium">{estadoTarea.tipo_tarea_nombre}</p>
        <EstadoBadge estado={estadoTarea.estado} />
        {estadoTarea.fecha_ultimo_registro && (
          <p className="text-xs text-black/50">
            Último: {estadoTarea.fecha_ultimo_registro}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Observaciones"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          className="rounded border border-black/10 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-black px-3 py-1 text-sm text-white"
        >
          Marcar realizado
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
