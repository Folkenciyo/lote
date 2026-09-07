"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiClient, ApiError } from "@/lib/apiClient";

export default function NuevoEquipoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [lote, setLote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const equipo = await apiClient.post<{ id: number }>("/equipos", {
        codigo,
        lote: Number(lote),
      });
      router.push(`/equipos/${equipo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el equipo");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nuevo equipo</h1>
      <form
        onSubmit={onSubmit}
        className="flex max-w-sm flex-col gap-3 rounded-xl border border-card-border bg-card p-6 shadow-sm"
      >
        <input
          type="text"
          placeholder="Código"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          required
          className="rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          type="number"
          placeholder="Lote"
          value={lote}
          onChange={(event) => setLote(event.target.value)}
          required
          min={1}
          max={21}
          className="rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Crear
        </button>
      </form>
    </div>
  );
}
