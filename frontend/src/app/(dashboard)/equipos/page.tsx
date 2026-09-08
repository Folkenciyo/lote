"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EquipoEstadoGrid } from "@/components/EquipoEstadoGrid";
import { EquipoTable } from "@/components/EquipoTable";
import { PlanificarTareasModal } from "@/components/PlanificarTareasModal";
import { RoleGate } from "@/components/RoleGate";
import { useEquipos } from "@/hooks/useEquipos";

type Vista = "tabla" | "estados";

export default function EquiposPage() {
  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState("");
  const [vista, setVista] = useState<Vista>("tabla");
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [mostrarPlanificar, setMostrarPlanificar] = useState(false);
  const { equipos, cargando } = useEquipos(codigo);

  useEffect(() => {
    const timeout = setTimeout(() => setCodigo(busqueda.trim()), 300);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  const alternarSeleccion = (equipoId: number) => {
    setSeleccionados((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(equipoId)) {
        nuevos.delete(equipoId);
      } else {
        nuevos.add(equipoId);
      }
      return nuevos;
    });
  };

  const equiposSeleccionados = equipos.filter((equipo) => seleccionados.has(equipo.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Equipos</h1>
          <p className="text-sm text-muted">{equipos.length} equipos</p>
        </div>
        <RoleGate rol="supervisor">
          <Link
            href="/equipos/nuevo"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Nuevo equipo
          </Link>
        </RoleGate>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por código… (varios: 1045-119-4509 o 1045, 119, 4509)"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          className="rounded-lg border border-card-border px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <div className="ml-auto flex rounded-lg border border-card-border p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setVista("tabla")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              vista === "tabla" ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Tabla
          </button>
          <button
            type="button"
            onClick={() => setVista("estados")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              vista === "estados" ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Estados
          </button>
        </div>
      </div>
      {vista === "tabla" && seleccionados.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span>{seleccionados.size} equipos seleccionados</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSeleccionados(new Set())}
              className="text-muted hover:text-foreground"
            >
              Quitar selección
            </button>
            <button
              onClick={() => setMostrarPlanificar(true)}
              className="rounded-lg bg-primary px-3 py-1.5 font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Planificar tareas
            </button>
          </div>
        </div>
      )}
      {cargando ? (
        <p className="text-muted">Cargando equipos…</p>
      ) : vista === "tabla" ? (
        <EquipoTable
          equipos={equipos}
          seleccionados={seleccionados}
          onToggleSeleccion={alternarSeleccion}
          mostrarActividad={!!codigo}
        />
      ) : (
        <EquipoEstadoGrid equipos={equipos} />
      )}
      {mostrarPlanificar && (
        <PlanificarTareasModal
          equipos={equiposSeleccionados}
          onClose={() => {
            setMostrarPlanificar(false);
            setSeleccionados(new Set());
          }}
        />
      )}
    </div>
  );
}
