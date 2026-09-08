"use client";

import { EstadoBadge } from "@/components/EstadoBadge";
import { RoleGate } from "@/components/RoleGate";
import { usePlanDiario } from "@/contexts/PlanDiarioContext";
import { useRegistrarTarea } from "@/hooks/useRegistrarTarea";
import { Equipo, EstadoOperativo, EstadoTarea } from "@/types";

// "activo" no es una opción aquí a propósito: si una tarea anterior ya marcó
// el vehículo como taller/averiado/baja, registrar otra tarea que sí está
// bien no debe poder reactivarlo por accidente. Reactivar es una acción
// explícita, solo desde "Estado operativo" en la ficha del equipo.
const ETIQUETAS_ESTADO_OPERATIVO: Record<Exclude<EstadoOperativo, "activo">, string> = {
  taller: "En taller",
  averiado: "Averiado",
  baja: "De baja",
};

export function TareaChecklistItem({
  equipoId,
  equipoCodigo,
  estadoTarea,
  onRegistrado,
  onEquipoActualizado,
}: {
  equipoId: number;
  equipoCodigo: string;
  estadoTarea: EstadoTarea;
  onRegistrado: () => void;
  onEquipoActualizado: (equipo: Equipo) => void;
}) {
  const { agregarItems } = usePlanDiario();
  const {
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
  } = useRegistrarTarea(
    equipoId,
    estadoTarea.tipo_tarea_id,
    onRegistrado,
    onEquipoActualizado
  );

  return (
    <form
      onSubmit={registrar}
      className="flex flex-wrap items-center justify-between gap-4 border-b border-card-border/60 px-5 py-4 last:border-b-0"
    >
      <div className="flex flex-col gap-1.5">
        <p className="font-medium">{estadoTarea.tipo_tarea_nombre}</p>
        <EstadoBadge estado={estadoTarea.estado} />
        {estadoTarea.fecha_ultimo_registro && (
          <p className="text-xs text-muted">
            Último: {estadoTarea.fecha_ultimo_registro}
            {estadoTarea.usuario_ultimo_registro && ` — ${estadoTarea.usuario_ultimo_registro}`}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            agregarItems([
              {
                equipoId,
                equipoCodigo,
                tipoTareaId: estadoTarea.tipo_tarea_id,
                tipoTareaNombre: estadoTarea.tipo_tarea_nombre,
              },
            ])
          }
          className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-background"
        >
          + Lista del día
        </button>
        <input
          type="text"
          placeholder="Observaciones"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="number"
          placeholder="Horas"
          value={horasTrabajo}
          onChange={(event) => setHorasTrabajo(event.target.value)}
          className="w-24 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="number"
          placeholder="Km"
          value={kilometros}
          onChange={(event) => setKilometros(event.target.value)}
          className="w-24 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
        <RoleGate rol="supervisor">
          <select
            value={estadoNuevo}
            onChange={(event) => setEstadoNuevo(event.target.value as EstadoOperativo | "")}
            title="Cambiar estado del vehículo al registrar"
            className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Estado del vehículo…</option>
            {Object.entries(ETIQUETAS_ESTADO_OPERATIVO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </RoleGate>
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
