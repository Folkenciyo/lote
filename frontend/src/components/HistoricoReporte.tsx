"use client";

import { useEffect, useState } from "react";

import { IconDownload } from "@/components/icons";
import { apiClient } from "@/lib/apiClient";
import { Equipo, Registro, TipoTarea } from "@/types";

export function HistoricoReporte() {
  const [anio, setAnio] = useState("");
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [equipoCodigo, setEquipoCodigo] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<Equipo[]>([]);
  const [tareas, setTareas] = useState<TipoTarea[]>([]);
  const [tipoTareaId, setTipoTareaId] = useState("");
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    apiClient.get<TipoTarea[]>("/tipos-tarea").then(setTareas);
  }, []);

  useEffect(() => {
    if (!busquedaEquipo || equipoCodigo === busquedaEquipo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSugerencias([]);
      return;
    }
    const timeout = setTimeout(() => {
      apiClient.get<Equipo[]>(`/equipos?codigo=${busquedaEquipo}`).then(setSugerencias);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaEquipo, equipoCodigo]);

  const params = new URLSearchParams();
  if (equipoId !== null) params.set("equipo_id", String(equipoId));
  if (tipoTareaId) params.set("tipo_tarea_id", tipoTareaId);
  if (anio) {
    params.set("desde", `${anio}-01-01`);
    params.set("hasta", `${anio}-12-31`);
  }
  const query = params.toString();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    apiClient.get<Registro[]>(`/registros${query ? `?${query}` : ""}`).then((data) => {
      setRegistros(data);
      setCargando(false);
    });
  }, [query]);

  const seleccionarEquipo = (equipo: Equipo) => {
    setEquipoId(equipo.id);
    setEquipoCodigo(equipo.codigo);
    setBusquedaEquipo(equipo.codigo);
    setSugerencias([]);
  };

  const limpiarEquipo = () => {
    setEquipoId(null);
    setEquipoCodigo(null);
    setBusquedaEquipo("");
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="font-medium">Histórico de mantenimiento</h2>
        <p className="text-sm text-muted">
          Filtra por año, equipo o tarea y descarga el resultado en PDF
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar equipo por código…"
            value={busquedaEquipo}
            onChange={(event) => {
              setBusquedaEquipo(event.target.value);
              if (equipoId !== null) {
                setEquipoId(null);
                setEquipoCodigo(null);
              }
            }}
            className="w-48 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          {sugerencias.length > 0 && (
            <ul className="absolute z-10 mt-1 w-48 rounded-lg border border-card-border bg-card shadow-md">
              {sugerencias.map((equipo) => (
                <li key={equipo.id}>
                  <button
                    type="button"
                    onClick={() => seleccionarEquipo(equipo)}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-background"
                  >
                    {equipo.codigo}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {equipoId !== null && (
          <button
            type="button"
            onClick={limpiarEquipo}
            className="text-xs text-muted underline"
          >
            Quitar filtro de equipo
          </button>
        )}

        <select
          value={tipoTareaId}
          onChange={(event) => setTipoTareaId(event.target.value)}
          className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Todas las tareas</option>
          {tareas.map((tarea) => (
            <option key={tarea.id} value={tarea.id}>
              {tarea.nombre}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Año"
          value={anio}
          onChange={(event) => setAnio(event.target.value)}
          className="w-24 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />

        <a
          href={`/api/exportaciones/historial.pdf${query ? `?${query}` : ""}`}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <IconDownload className="h-4 w-4" />
          Descargar PDF
        </a>
      </div>

      {cargando ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : registros.length === 0 ? (
        <p className="text-sm text-muted">Sin registros para estos filtros.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Equipo</th>
                <th className="px-3 py-2 font-medium">Tarea</th>
                <th className="px-3 py-2 font-medium">Registrado por</th>
                <th className="px-3 py-2 font-medium">Horas</th>
                <th className="px-3 py-2 font-medium">Km</th>
                <th className="px-3 py-2 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id} className="border-t border-card-border/60">
                  <td className="px-3 py-2">{registro.fecha_realizada}</td>
                  <td className="px-3 py-2 font-medium">{registro.equipo_codigo}</td>
                  <td className="px-3 py-2">{registro.tipo_tarea_nombre}</td>
                  <td className="px-3 py-2 font-medium">{registro.usuario_nombre}</td>
                  <td className="px-3 py-2 text-muted">{registro.horas_trabajo ?? "-"}</td>
                  <td className="px-3 py-2 text-muted">{registro.kilometros ?? "-"}</td>
                  <td className="px-3 py-2 text-muted">{registro.observaciones ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
