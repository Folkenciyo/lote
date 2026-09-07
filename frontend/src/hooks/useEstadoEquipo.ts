"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { EstadoTarea } from "@/types";

export function useEstadoEquipo(equipoId: number) {
  const [estados, setEstados] = useState<EstadoTarea[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<EstadoTarea[]>(`/estado/equipo/${equipoId}`);
    setEstados(data);
    setCargando(false);
  }, [equipoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return { estados, cargando, recargar };
}
