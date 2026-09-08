"use client";

import { FormEvent, useState } from "react";

import { apiClient, ApiError } from "@/lib/apiClient";
import { Equipo, EstadoOperativo } from "@/types";

export function useRegistrarTarea(
  equipoId: number,
  tipoTareaId: number,
  onRegistrado?: () => void,
  onEquipoActualizado?: (equipo: Equipo) => void
) {
  const [observaciones, setObservaciones] = useState("");
  const [horasTrabajo, setHorasTrabajo] = useState("");
  const [kilometros, setKilometros] = useState("");
  const [estadoNuevo, setEstadoNuevo] = useState<EstadoOperativo | "">("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const registrar = async (event?: FormEvent) => {
    event?.preventDefault();
    setEnviando(true);
    setError(null);
    setGuardado(false);
    try {
      await apiClient.post("/registros", {
        equipo_id: equipoId,
        tipo_tarea_id: tipoTareaId,
        fecha_realizada: new Date().toISOString().slice(0, 10),
        observaciones: observaciones || null,
        horas_trabajo: horasTrabajo ? Number(horasTrabajo) : null,
        kilometros: kilometros ? Number(kilometros) : null,
      });
      if (estadoNuevo) {
        try {
          const equipoActualizado = await apiClient.post<Equipo>(
            `/equipos/${equipoId}/estado`,
            { estado_nuevo: estadoNuevo, motivo: observaciones || null }
          );
          onEquipoActualizado?.(equipoActualizado);
        } catch (err) {
          setError(
            err instanceof ApiError
              ? `Tarea registrada, pero no se pudo cambiar el estado: ${err.message}`
              : "Tarea registrada, pero no se pudo cambiar el estado del vehículo"
          );
        }
      }
      setObservaciones("");
      setHorasTrabajo("");
      setKilometros("");
      setEstadoNuevo("");
      onRegistrado?.();
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar la tarea");
      return false;
    } finally {
      setEnviando(false);
    }
  };

  return {
    observaciones,
    setObservaciones,
    horasTrabajo,
    setHorasTrabajo,
    kilometros,
    setKilometros,
    estadoNuevo,
    setEstadoNuevo,
    enviando,
    error,
    guardado,
    registrar,
  };
}
