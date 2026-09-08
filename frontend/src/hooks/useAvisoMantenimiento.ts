"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { Avisos } from "@/types";

export function useAvisoMantenimiento() {
  const [avisos, setAvisos] = useState<Avisos | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<Avisos>("/dashboard/avisos-mantenimiento");
    setAvisos(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return { avisos, cargando, recargar };
}
