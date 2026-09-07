"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { DashboardResumen } from "@/types";

export function useDashboard() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<DashboardResumen>("/dashboard/resumen");
    setResumen(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return { resumen, cargando, recargar };
}
