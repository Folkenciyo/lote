"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { RoleGate } from "@/components/RoleGate";
import { apiClient, ApiError } from "@/lib/apiClient";
import { Usuario } from "@/types";

function FormularioUsuario({ onCreado }: { onCreado: () => void }) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"tecnico" | "supervisor">("tecnico");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await apiClient.post("/usuarios", { email, nombre, password, rol });
      setEmail("");
      setNombre("");
      setPassword("");
      setRol("tecnico");
      onCreado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el usuario");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2 p-5">
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        required
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <select
        value={rol}
        onChange={(event) => setRol(event.target.value as "tecnico" | "supervisor")}
        className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      >
        <option value="tecnico">Técnico</option>
        <option value="supervisor">Supervisor</option>
      </select>
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Crear usuario
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const data = await apiClient.get<Usuario[]>("/usuarios");
    setUsuarios(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return (
    <RoleGate rol="supervisor">
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <div className="rounded-xl border border-card-border bg-card shadow-sm">
          <div className="border-b border-card-border px-5 py-4">
            <h2 className="font-medium">Añadir usuario</h2>
          </div>
          <FormularioUsuario onCreado={recargar} />
        </div>
        <div className="rounded-xl border border-card-border bg-card shadow-sm">
          {cargando ? (
            <p className="p-5 text-sm text-muted">Cargando usuarios…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted">
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Rol</th>
                    <th className="px-5 py-3 font-medium">Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t border-card-border/60">
                      <td className="px-5 py-2.5 font-medium">{usuario.nombre}</td>
                      <td className="px-5 py-2.5 text-muted">{usuario.email}</td>
                      <td className="px-5 py-2.5">{usuario.rol}</td>
                      <td className="px-5 py-2.5">{usuario.activo ? "Sí" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}
