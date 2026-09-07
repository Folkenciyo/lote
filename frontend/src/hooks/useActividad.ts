"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { ActividadUsuario } from "@/types";

export function useActividad() {
  const [actividad, setActividad] = useState<ActividadUsuario[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<ActividadUsuario[]>("/dashboard/actividad");
    setActividad(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return { actividad, cargando, recargar };
}
