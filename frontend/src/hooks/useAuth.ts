"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiClient, ApiError } from "@/lib/apiClient";
import { Usuario } from "@/types";

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  const cargarUsuario = useCallback(async () => {
    setCargando(true);
    try {
      const data = await apiClient.get<Usuario>("/auth/me");
      setUsuario(data);
    } catch (error) {
      setUsuario(null);
      if (!(error instanceof ApiError && error.status === 401)) {
        console.error("Error al cargar el usuario autenticado", error);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial de sesión: sin TanStack Query (decisión del plan), el
    // patrón fetch-en-efecto es intencional aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuario();
  }, [cargarUsuario]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "Credenciales inválidas" }));
        throw new Error(body.detail ?? "Credenciales inválidas");
      }
      await cargarUsuario();
      router.push("/");
    },
    [cargarUsuario, router],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsuario(null);
    router.push("/login");
  }, [router]);

  return { usuario, cargando, login, logout };
}
