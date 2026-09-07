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
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        required
        className="rounded border border-black/10 px-2 py-1 text-sm"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="rounded border border-black/10 px-2 py-1 text-sm"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="rounded border border-black/10 px-2 py-1 text-sm"
      />
      <select
        value={rol}
        onChange={(event) => setRol(event.target.value as "tecnico" | "supervisor")}
        className="rounded border border-black/10 px-2 py-1 text-sm"
      >
        <option value="tecnico">Técnico</option>
        <option value="supervisor">Supervisor</option>
      </select>
      <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
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
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold">Usuarios</h1>
        <FormularioUsuario onCreado={recargar} />
        {cargando ? (
          <p>Cargando usuarios…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-2">Nombre</th>
                <th className="py-2">Email</th>
                <th className="py-2">Rol</th>
                <th className="py-2">Activo</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-black/5">
                  <td className="py-2">{usuario.nombre}</td>
                  <td className="py-2">{usuario.email}</td>
                  <td className="py-2">{usuario.rol}</td>
                  <td className="py-2">{usuario.activo ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </RoleGate>
  );
}
