"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { RoleGate } from "@/components/RoleGate";
import { apiClient, ApiError } from "@/lib/apiClient";
import { Equipo } from "@/types";

export function EquipoInfoForm({
  equipo,
  onActualizado,
}: {
  equipo: Equipo;
  onActualizado: (equipo: Equipo) => void;
}) {
  const router = useRouter();
  const [marca, setMarca] = useState(equipo.marca ?? "");
  const [modelo, setModelo] = useState(equipo.modelo ?? "");
  const [tipo, setTipo] = useState(equipo.tipo ?? "");
  const [lote, setLote] = useState(String(equipo.lote));
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const guardarCambios = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    setGuardado(false);
    try {
      const actualizado = await apiClient.patch<Equipo>(`/equipos/${equipo.id}`, {
        marca: marca || null,
        modelo: modelo || null,
        tipo: tipo || null,
        lote: Number(lote),
      });
      onActualizado(actualizado);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar el equipo");
    } finally {
      setEnviando(false);
    }
  };

  const alternarArchivado = async () => {
    setError(null);
    try {
      if (equipo.activo) {
        await apiClient.delete(`/equipos/${equipo.id}`);
        onActualizado({ ...equipo, activo: false });
        router.push("/equipos");
      } else {
        const actualizado = await apiClient.patch<Equipo>(`/equipos/${equipo.id}`, {
          activo: true,
        });
        onActualizado(actualizado);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al archivar el equipo");
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
        <h2 className="font-medium">Datos del equipo</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            equipo.activo ? "bg-green-100 text-green-700" : "bg-black/5 text-muted"
          }`}
        >
          {equipo.activo ? "Activo" : "Archivado"}
        </span>
      </div>
      <RoleGate rol="supervisor">
        <form onSubmit={guardarCambios} className="flex flex-wrap items-end gap-2 p-5">
          <input
            type="text"
            placeholder="Marca"
            value={marca}
            onChange={(event) => setMarca(event.target.value)}
            className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Modelo"
            value={modelo}
            onChange={(event) => setModelo(event.target.value)}
            className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Tipo"
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
            className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="number"
            min={1}
            max={21}
            value={lote}
            onChange={(event) => setLote(event.target.value)}
            className="w-20 rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={alternarArchivado}
            className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background"
          >
            {equipo.activo ? "Archivar equipo" : "Reactivar equipo"}
          </button>
          {guardado && <span className="text-sm text-green-700">✓ Guardado</span>}
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
