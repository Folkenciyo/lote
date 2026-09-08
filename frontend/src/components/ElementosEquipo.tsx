"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { IconDownload } from "@/components/icons";
import { RoleGate } from "@/components/RoleGate";
import { apiClient, ApiError } from "@/lib/apiClient";
import { Elemento } from "@/types";

export function ElementosEquipo({ equipoId }: { equipoId: number }) {
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<Elemento[]>(`/equipos/${equipoId}/elementos`);
    setElementos(data);
    setCargando(false);
  }, [equipoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const crear = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await apiClient.post(`/equipos/${equipoId}/elementos`, { nombre, referencia });
      setNombre("");
      setReferencia("");
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al añadir el elemento");
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (elementoId: number) => {
    setError(null);
    try {
      await apiClient.delete(`/elementos/${elementoId}`);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar el elemento");
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
        <div>
          <h2 className="font-medium">Elementos y repuestos</h2>
          <p className="text-sm text-muted">Carburador, filtros, marca de aceite…</p>
        </div>
        <a
          href={`/api/exportaciones/equipo/${equipoId}/elementos.pdf`}
          className="flex items-center gap-2 rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background"
        >
          <IconDownload className="h-4 w-4" />
          Descargar PDF
        </a>
      </div>

      {cargando ? (
        <p className="p-5 text-sm text-muted">Cargando…</p>
      ) : elementos.length === 0 ? (
        <p className="p-5 text-sm text-muted">Este equipo no tiene elementos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-5 py-2 font-medium">Elemento</th>
                <th className="px-5 py-2 font-medium">Referencia</th>
                <RoleGate rol="supervisor">
                  <th className="px-5 py-2 font-medium"></th>
                </RoleGate>
              </tr>
            </thead>
            <tbody>
              {elementos.map((elemento) => (
                <tr key={elemento.id} className="border-t border-card-border/60">
                  <td className="px-5 py-2.5 font-medium">{elemento.nombre}</td>
                  <td className="px-5 py-2.5 text-muted">{elemento.referencia}</td>
                  <RoleGate rol="supervisor">
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => eliminar(elemento.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </RoleGate>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoleGate rol="supervisor">
        <form
          onSubmit={crear}
          className="flex flex-wrap items-end gap-2 border-t border-card-border p-5"
        >
          <input
            type="text"
            placeholder="Elemento (ej. Filtro de aceite)"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
            className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Referencia"
            value={referencia}
            onChange={(event) => setReferencia(event.target.value)}
            required
            className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Añadir
          </button>
          {error && (
            <p role="alert" className="w-full text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      </RoleGate>
    </div>
  );
}
