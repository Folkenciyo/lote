"use client";

import { FormEvent, useState } from "react";

import { IconTruck } from "@/components/icons";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await login(email.trim(), password.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-6">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
            <IconTruck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Mantenimiento de Flota</h1>
            <p className="text-sm text-muted">Inicia sesión para continuar</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="mt-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
