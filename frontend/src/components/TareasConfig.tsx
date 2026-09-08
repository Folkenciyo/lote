"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { apiClient, ApiError } from "@/lib/apiClient";
import { CategoriaTarea, TipoTarea } from "@/types";

function FilaTarea({ tarea, onActualizada }: { tarea: TipoTarea; onActualizada: (t: TipoTarea) => void }) {
  const [periodicidad, setPeriodicidad] = useState(String(tarea.periodicidad_dias));
  const [limiteHoras, setLimiteHoras] = useState(tarea.limite_horas?.toString() ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardarPeriodicidad = async () => {
    if (Number(periodicidad) === tarea.periodicidad_dias) return;
    setGuardando(true);
    setError(null);
    try {
      const actualizada = await apiClient.patch<TipoTarea>(`/tipos-tarea/${tarea.id}`, {
        periodicidad_dias: Number(periodicidad),
      });
      onActualizada(actualizada);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const guardarLimiteHoras = async () => {
    const nuevoValor = limiteHoras ? Number(limiteHoras) : null;
    if (nuevoValor === tarea.limite_horas) return;
    setGuardando(true);
    setError(null);
    try {
      const actualizada = await apiClient.patch<TipoTarea>(`/tipos-tarea/${tarea.id}`, {
        limite_horas: nuevoValor,
      });
      onActualizada(actualizada);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <tr className="border-t border-card-border/60">
      <td className="px-5 py-2.5 font-medium">{tarea.nombre}</td>
      <td className="px-5 py-2.5 text-muted">{tarea.categoria}</td>
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={periodicidad}
            onChange={(event) => setPeriodicidad(event.target.value)}
            onBlur={guardarPeriodicidad}
            disabled={guardando}
            className="w-20 rounded-lg border border-card-border px-2 py-1 text-sm outline-none focus:border-primary"
          />
          <span className="text-xs text-muted">días</span>
        </div>
      </td>
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="Sin límite"
            value={limiteHoras}
            onChange={(event) => setLimiteHoras(event.target.value)}
            onBlur={guardarLimiteHoras}
            disabled={guardando}
            className="w-24 rounded-lg border border-card-border px-2 py-1 text-sm outline-none focus:border-primary"
          />
          <span className="text-xs text-muted">horas</span>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

function FormularioTarea({ onCreada }: { onCreada: () => void }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaTarea>("mantenimiento");
  const [periodicidad, setPeriodicidad] = useState("30");
  const [limiteHoras, setLimiteHoras] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await apiClient.post("/tipos-tarea", {
        nombre: nombre.toUpperCase(),
        categoria,
        periodicidad_dias: Number(periodicidad),
        limite_horas: limiteHoras ? Number(limiteHoras) : null,
      });
      setNombre("");
      setPeriodicidad("30");
      setLimiteHoras("");
      onCreada();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear la tarea");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2 p-5">
      <input
        type="text"
        placeholder="Nombre (ej. FRENOS)"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        required
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <select
        value={categoria}
        onChange={(event) => setCategoria(event.target.value as CategoriaTarea)}
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      >
        <option value="engrase">Engrase</option>
        <option value="mantenimiento">Mantenimiento</option>
      </select>
      <input
        type="number"
        min={1}
        placeholder="Periodicidad (días)"
        value={periodicidad}
        onChange={(event) => setPeriodicidad(event.target.value)}
        required
        className="w-40 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <input
        type="number"
        min={1}
        placeholder="Límite de horas (opcional)"
        value={limiteHoras}
        onChange={(event) => setLimiteHoras(event.target.value)}
        className="w-44 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Crear tarea
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export function TareasConfig() {
  const [tareas, setTareas] = useState<TipoTarea[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<TipoTarea[]>("/tipos-tarea");
    setTareas(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  const actualizarEnLista = (tarea: TipoTarea) => {
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? tarea : t)));
  };

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Tareas de mantenimiento y engrase</h2>
        <p className="text-sm text-muted">
          Edita periodicidad o límite de horas (guarda al salir del campo) o crea una tarea nueva.
          El límite de horas es opcional — una tarea vence antes por lo que llegue primero, días u horas.
        </p>
      </div>
      {cargando ? (
        <p className="p-5 text-sm text-muted">Cargando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-5 py-2 font-medium">Nombre</th>
                <th className="px-5 py-2 font-medium">Categoría</th>
                <th className="px-5 py-2 font-medium">Periodicidad</th>
                <th className="px-5 py-2 font-medium">Límite de horas</th>
              </tr>
            </thead>
            <tbody>
              {tareas.map((tarea) => (
                <FilaTarea key={tarea.id} tarea={tarea} onActualizada={actualizarEnLista} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="border-t border-card-border">
        <FormularioTarea onCreada={recargar} />
      </div>
    </div>
  );
}
