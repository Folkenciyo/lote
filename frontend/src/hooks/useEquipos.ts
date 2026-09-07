"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { Equipo } from "@/types";

export function useEquipos(lote?: number) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const query = lote !== undefined ? `?lote=${lote}` : "";
    const data = await apiClient.get<Equipo[]>(`/equipos${query}`);
    setEquipos(data);
    setCargando(false);
  }, [lote]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return { equipos, cargando, recargar };
}
