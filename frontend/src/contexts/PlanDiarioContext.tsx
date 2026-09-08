"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import {
  agregarItemsPlanDia,
  alternarHechoPlanDia,
  leerPlanDia,
  limpiarHechasPlanDia,
  PlanDiarioItem,
  quitarItemPlanDia,
} from "@/lib/planDiario";

interface PlanDiarioContextValue {
  items: PlanDiarioItem[];
  agregarItems: (nuevos: Array<Omit<PlanDiarioItem, "id" | "hecho">>) => void;
  alternarHecho: (id: string) => void;
  quitarItem: (id: string) => void;
  limpiarHechas: () => void;
}

const PlanDiarioContext = createContext<PlanDiarioContextValue | null>(null);

export function PlanDiarioProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PlanDiarioItem[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(leerPlanDia());
  }, []);

  const value: PlanDiarioContextValue = {
    items,
    agregarItems: (nuevos) => setItems(agregarItemsPlanDia(nuevos)),
    alternarHecho: (id) => setItems(alternarHechoPlanDia(id)),
    quitarItem: (id) => setItems(quitarItemPlanDia(id)),
    limpiarHechas: () => setItems(limpiarHechasPlanDia()),
  };

  return <PlanDiarioContext.Provider value={value}>{children}</PlanDiarioContext.Provider>;
}

export function usePlanDiario(): PlanDiarioContextValue {
  const context = useContext(PlanDiarioContext);
  if (!context) {
    throw new Error("usePlanDiario debe usarse dentro de PlanDiarioProvider");
  }
  return context;
}
