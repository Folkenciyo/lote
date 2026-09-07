"use client";

import { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { Rol } from "@/types";

export function RoleGate({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { usuario } = useAuth();
  if (!usuario || usuario.rol !== rol) return null;
  return <>{children}</>;
}
