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
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <h1 className="text-lg font-semibold">Nuevo equipo</h1>
      <input
        type="text"
        placeholder="Código"
        value={codigo}
        onChange={(event) => setCodigo(event.target.value)}
        required
        className="rounded border border-black/10 px-3 py-2"
      />
      <input
        type="number"
        placeholder="Lote"
        value={lote}
        onChange={(event) => setLote(event.target.value)}
        required
        min={1}
        max={21}
        className="rounded border border-black/10 px-3 py-2"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="rounded bg-black px-3 py-2 text-white"
      >
        Crear
      </button>
    </form>
  );
}
