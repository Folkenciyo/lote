"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { COLORES_ETIQUETA, ESTILOS_COLOR, ETIQUETAS_COLOR, SWATCH_COLOR } from "@/lib/coloresEtiqueta";
import { apiClient, ApiError } from "@/lib/apiClient";
import { ColorEtiqueta, Etiqueta, EstadoOperativo } from "@/types";

const ETIQUETAS_ESTADO: Record<EstadoOperativo, string> = {
  activo: "Activo",
  taller: "En taller",
  averiado: "Averiado",
  baja: "De baja",
};

function SelectorColor({
  value,
  onChange,
}: {
  value: ColorEtiqueta;
  onChange: (color: ColorEtiqueta) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {COLORES_ETIQUETA.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={ETIQUETAS_COLOR[color]}
          aria-label={ETIQUETAS_COLOR[color]}
          aria-pressed={value === color}
          className={`h-6 w-6 rounded-full ${SWATCH_COLOR[color]} ${
            value === color ? "ring-2 ring-offset-2 ring-primary" : ""
          }`}
        />
      ))}
    </div>
  );
}

function FilaEtiqueta({
  etiqueta,
  onEliminada,
}: {
  etiqueta: Etiqueta;
  onEliminada: () => void;
}) {
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    setEliminando(true);
    try {
      await apiClient.delete(`/etiquetas/${etiqueta.id}`);
      onEliminada();
    } finally {
      setEliminando(false);
    }
  };

  return (
    <tr className="border-t border-card-border/60">
      <td className="px-5 py-2.5">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTILOS_COLOR[etiqueta.color]}`}
        >
          {etiqueta.nombre}
        </span>
      </td>
      <td className="px-5 py-2.5 text-muted">{ETIQUETAS_ESTADO[etiqueta.estado_operativo]}</td>
      <td className="px-5 py-2.5 text-muted">{ETIQUETAS_COLOR[etiqueta.color]}</td>
      <td className="px-5 py-2.5 text-right">
        <button
          onClick={eliminar}
          disabled={eliminando}
          className="text-xs text-red-600 hover:underline disabled:opacity-60"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}

function FormularioEtiqueta({ onCreada }: { onCreada: () => void }) {
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState<EstadoOperativo>("taller");
  const [color, setColor] = useState<ColorEtiqueta>("red");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await apiClient.post("/etiquetas", { nombre, estado_operativo: estado, color });
      setNombre("");
      onCreada();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear la etiqueta");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 p-5">
      <input
        type="text"
        placeholder="Nombre (ej. Neumático pinchado)"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        required
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <select
        value={estado}
        onChange={(event) => setEstado(event.target.value as EstadoOperativo)}
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      >
        {Object.entries(ETIQUETAS_ESTADO).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </select>
      <SelectorColor value={color} onChange={setColor} />
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Crear etiqueta
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export function EtiquetasConfig() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<Etiqueta[]>("/etiquetas");
    setEtiquetas(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Etiquetas</h2>
        <p className="text-sm text-muted">
          Motivos con color para explicar por qué un vehículo está en taller, averiado o de
          baja. Se asignan desde la ficha de cada equipo.
        </p>
      </div>
      {cargando ? (
        <p className="p-5 text-sm text-muted">Cargando…</p>
      ) : etiquetas.length === 0 ? (
        <p className="p-5 text-sm text-muted">Todavía no hay etiquetas creadas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-5 py-2 font-medium">Etiqueta</th>
                <th className="px-5 py-2 font-medium">Estado</th>
                <th className="px-5 py-2 font-medium">Color</th>
                <th className="px-5 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {etiquetas.map((etiqueta) => (
                <FilaEtiqueta key={etiqueta.id} etiqueta={etiqueta} onEliminada={recargar} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="border-t border-card-border">
        <FormularioEtiqueta onCreada={recargar} />
      </div>
    </div>
  );
}
