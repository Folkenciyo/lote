"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

import {
  agregarItemsPlanDia,
  alternarHechoPlanDia,
  idItem,
  leerPlanDia,
  limpiarHechasPlanDia,
  PlanDiarioItem,
  quitarEquipoPlanDia,
  quitarItemPlanDia,
  vaciarPlanDia,
} from "@/lib/planDiario";

const DURACION_AVISO_MS = 3000;

type NuevoItem = Omit<PlanDiarioItem, "id" | "hecho">;

interface PlanDiarioContextValue {
  items: PlanDiarioItem[];
  agregarItems: (nuevos: NuevoItem[]) => void;
  estaEnLista: (equipoId: number, tipoTareaId: number) => boolean;
  alternarHecho: (id: string) => void;
  quitarItem: (id: string) => void;
  quitarEquipo: (equipoId: number) => void;
  limpiarHechas: () => void;
  vaciar: () => void;
}

const PlanDiarioContext = createContext<PlanDiarioContextValue | null>(null);

function textoAviso(nuevos: NuevoItem[], anadidos: number): string {
  if (anadidos === 0) {
    return nuevos.length === 1 ? "Ya estaba en la lista del día" : "Ya estaban todas en la lista del día";
  }
  if (nuevos.length === 1) {
    const [item] = nuevos;
    return `${item.tipoTareaNombre} (${item.equipoCodigo}) añadida a la lista del día`;
  }
  return `${anadidos} tarea${anadidos === 1 ? "" : "s"} añadida${anadidos === 1 ? "" : "s"} a la lista del día`;
}

export function PlanDiarioProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PlanDiarioItem[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const timeoutAviso = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(leerPlanDia());
    return () => {
      if (timeoutAviso.current) clearTimeout(timeoutAviso.current);
    };
  }, []);

  const mostrarAviso = (texto: string) => {
    if (timeoutAviso.current) clearTimeout(timeoutAviso.current);
    setAviso(texto);
    timeoutAviso.current = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
  };

  const ids = new Set(items.map((item) => item.id));

  const value: PlanDiarioContextValue = {
    items,
    agregarItems: (nuevos) => {
      const previos = leerPlanDia().length;
      const actualizados = agregarItemsPlanDia(nuevos);
      const anadidos = actualizados.length - previos;
      setItems(actualizados);
      mostrarAviso(textoAviso(nuevos, anadidos));
    },
    estaEnLista: (equipoId, tipoTareaId) => ids.has(idItem(equipoId, tipoTareaId)),
    alternarHecho: (id) => setItems(alternarHechoPlanDia(id)),
    quitarItem: (id) => setItems(quitarItemPlanDia(id)),
    quitarEquipo: (equipoId) => setItems(quitarEquipoPlanDia(equipoId)),
    limpiarHechas: () => setItems(limpiarHechasPlanDia()),
    vaciar: () => setItems(vaciarPlanDia()),
  };

  return (
    <PlanDiarioContext.Provider value={value}>
      {children}
      {aviso && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          <span aria-hidden="true">✓</span>
          {aviso}
        </div>
      )}
    </PlanDiarioContext.Provider>
  );
}

export function usePlanDiario(): PlanDiarioContextValue {
  const context = useContext(PlanDiarioContext);
  if (!context) {
    throw new Error("usePlanDiario debe usarse dentro de PlanDiarioProvider");
  }
  return context;
}
