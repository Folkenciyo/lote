"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/apiClient";
import { Equipo } from "@/types";

export function useEquipos(codigo?: string) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const idPeticionRef = useRef(0);

  const recargar = useCallback(async () => {
    // Con debounce corto, varias peticiones pueden estar en vuelo a la vez
    // (una por cada tecla). Sin esto, una respuesta más antigua y más amplia
    // podía llegar después que la correcta y sobrescribirla. Solo se aplica
    // la respuesta de la última petición disparada, se descarta cualquier
    // otra que llegue fuera de orden.
    const idPeticion = ++idPeticionRef.current;
    setCargando(true);
    const params = new URLSearchParams();
    if (codigo) {
      // Varios códigos separados por guion y/o coma (ej. "1045-119-4509" o
      // "1045, 119, 4509", incluso pegados desde una hoja de cálculo) buscan
      // cada uno por separado (ILIKE parcial, unidos por OR); un único
      // código sin separadores se comporta como antes.
      const esMultiple = codigo.includes("-") || codigo.includes(",");
      params.set(esMultiple ? "codigos" : "codigo", codigo);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiClient.get<Equipo[]>(`/equipos${query}`);
    if (idPeticion !== idPeticionRef.current) return;
    setEquipos(data);
    setCargando(false);
  }, [codigo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return { equipos, cargando, recargar };
}
