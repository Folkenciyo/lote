"use client";

import { EstadoBadge } from "@/components/EstadoBadge";
import { ObservacionAviso } from "@/components/ObservacionAviso";
import { useRegistrarTarea } from "@/hooks/useRegistrarTarea";
import { PlanDiarioItem } from "@/lib/planDiario";
import { EstadoOperativo, EstadoTarea } from "@/types";

// "activo" no es una opción aquí a propósito: si una tarea anterior ya marcó
// el vehículo como taller/averiado/baja, registrar otra tarea que sí está
// bien no debe poder reactivarlo por accidente. Reactivar es una acción
// explícita, solo desde "Estado operativo" en la ficha del equipo.
const ETIQUETAS_ESTADO_OPERATIVO: Record<Exclude<EstadoOperativo, "activo">, string> = {
  taller: "En taller",
  averiado: "Averiado",
  baja: "De baja",
};

export function PlanDiarioItemRow({
  item,
  estadoTarea,
  onHecho,
  onQuitar,
}: {
  item: PlanDiarioItem;
  estadoTarea: EstadoTarea | undefined;
  onHecho: () => void;
  onQuitar: () => void;
}) {
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
  } = useRegistrarTarea(item.equipoId, item.tipoTareaId, onHecho);

  if (item.hecho) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-l-4 border-b-card-border/60 border-l-green-500 bg-green-50 px-5 py-3 last:border-b-0">
        <span className="flex items-center gap-2 font-medium text-green-700">
          <span aria-hidden="true">✓</span>
          <span className="line-through">{item.tipoTareaNombre}</span>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs no-underline">Hecha</span>
        </span>
        <button
          onClick={onQuitar}
          aria-label="Quitar de la lista"
          className="shrink-0 text-muted hover:text-red-600"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={registrar}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border/60 px-5 py-3 last:border-b-0"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{item.tipoTareaNombre}</span>
        <div className="flex flex-wrap items-center gap-2">
          {estadoTarea && <EstadoBadge estado={estadoTarea.estado} />}
          {estadoTarea?.fecha_ultimo_registro && (
            <span className="text-xs text-muted">
              Último: {estadoTarea.fecha_ultimo_registro}
              {estadoTarea.usuario_ultimo_registro && ` — ${estadoTarea.usuario_ultimo_registro}`}
            </span>
          )}
        </div>
        {estadoTarea?.observaciones_ultimo_registro && (
          <ObservacionAviso texto={estadoTarea.observaciones_ultimo_registro} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Observaciones"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          className="w-40 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="number"
          placeholder="Horas"
          value={horasTrabajo}
          onChange={(event) => setHorasTrabajo(event.target.value)}
          className="w-20 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="number"
          placeholder="Km"
          value={kilometros}
          onChange={(event) => setKilometros(event.target.value)}
          className="w-20 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
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
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Marcar realizado
        </button>
        {guardado && <span className="text-sm text-green-700">✓</span>}
        <button
          type="button"
          onClick={onQuitar}
          aria-label="Quitar de la lista"
          className="shrink-0 text-muted hover:text-red-600"
        >
          ✕
        </button>
      </div>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
