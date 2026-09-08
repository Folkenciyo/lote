"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { RoleGate } from "@/components/RoleGate";
import { apiClient, ApiError } from "@/lib/apiClient";
import { CambioEstadoEquipo, Equipo, EstadoOperativo } from "@/types";

const ETIQUETAS: Record<EstadoOperativo, string> = {
  activo: "Activo",
  taller: "En taller",
  baja: "De baja",
  averiado: "Averiado",
};

const ESTILOS: Record<EstadoOperativo, string> = {
  activo: "bg-green-100 text-green-700",
  taller: "bg-amber-100 text-amber-700",
  baja: "bg-black/10 text-muted",
  averiado: "bg-orange-100 text-orange-700",
};

export function EstadoOperativoEquipo({
  equipo,
  onActualizado,
}: {
  equipo: Equipo;
  onActualizado: (equipo: Equipo) => void;
}) {
  const [cambios, setCambios] = useState<CambioEstadoEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadoNuevo, setEstadoNuevo] = useState<EstadoOperativo>(equipo.estado_operativo);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargarCambios = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<CambioEstadoEquipo[]>(
      `/equipos/${equipo.id}/cambios-estado`,
    );
    setCambios(data);
    setCargando(false);
  }, [equipo.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCambios();
  }, [cargarCambios]);

  const cambiarEstado = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const actualizado = await apiClient.post<Equipo>(`/equipos/${equipo.id}/estado`, {
        estado_nuevo: estadoNuevo,
        motivo: motivo || null,
      });
      onActualizado(actualizado);
      setMotivo("");
      await cargarCambios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cambiar el estado");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Estado operativo</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[equipo.estado_operativo]}`}
        >
          {ETIQUETAS[equipo.estado_operativo]}
        </span>
      </div>

      <RoleGate rol="supervisor">
        <form onSubmit={cambiarEstado} className="flex flex-wrap items-end gap-2 p-5">
          <select
            value={estadoNuevo}
            onChange={(event) => setEstadoNuevo(event.target.value as EstadoOperativo)}
            className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          >
            <option value="activo">Activo</option>
            <option value="taller">En taller</option>
            <option value="averiado">Averiado</option>
            <option value="baja">De baja</option>
          </select>
          <input
            type="text"
            placeholder="Motivo (opcional)"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            className="min-w-[16rem] flex-1 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={enviando || estadoNuevo === equipo.estado_operativo}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Cambiar estado
          </button>
          {error && (
            <p role="alert" className="w-full text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      </RoleGate>

      {!cargando && cambios.length > 0 && (
        <div className="overflow-x-auto border-t border-card-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium">Cambio</th>
                <th className="px-5 py-2 font-medium">Por</th>
                <th className="px-5 py-2 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {cambios.map((cambio) => (
                <tr key={cambio.id} className="border-t border-card-border/60">
                  <td className="px-5 py-2.5 text-muted">
                    {cambio.created_at.slice(0, 10)}
                  </td>
                  <td className="px-5 py-2.5">
                    {ETIQUETAS[cambio.estado_anterior]} → {ETIQUETAS[cambio.estado_nuevo]}
                  </td>
                  <td className="px-5 py-2.5 font-medium">{cambio.usuario_nombre}</td>
                  <td className="px-5 py-2.5 text-muted">{cambio.motivo ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
