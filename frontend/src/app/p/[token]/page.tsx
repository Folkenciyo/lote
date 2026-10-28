import type { Metadata } from "next";
import { cache } from "react";

import { EstadoBadge } from "@/components/EstadoBadge";
import { EstadoOperativoBadge, NOMBRES_ESTADO_OPERATIVO } from "@/components/EstadoOperativoBadge";
import { ObservacionAviso } from "@/components/ObservacionAviso";
import { BACKEND_URL } from "@/lib/backend";
import { ESTILOS_COLOR } from "@/lib/coloresEtiqueta";
import { formatearFecha } from "@/lib/compartir";
import { EquipoPublico } from "@/types";

type Resultado =
  | { tipo: "ok"; equipo: EquipoPublico }
  | { tipo: "caducado" }
  | { tipo: "invalido" };

// cache(): generateMetadata y la página comparten una sola petición al backend.
const cargarEquipo = cache(async (token: string): Promise<Resultado> => {
  const respuesta = await fetch(
    `${BACKEND_URL}/api/publico/equipo/${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (respuesta.status === 410) return { tipo: "caducado" };
  if (!respuesta.ok) return { tipo: "invalido" };
  return { tipo: "ok", equipo: (await respuesta.json()) as EquipoPublico };
});

function resumenPendientes(equipo: EquipoPublico): { vencidas: number; proximas: number } {
  return {
    vencidas: equipo.estados.filter((e) => e.estado === "vencido").length,
    proximas: equipo.estados.filter((e) => e.estado === "proximo_a_vencer").length,
  };
}

export async function generateMetadata(props: PageProps<"/p/[token]">): Promise<Metadata> {
  const { token } = await props.params;
  const resultado = await cargarEquipo(token);
  const base: Metadata = { robots: { index: false, follow: false } };
  if (resultado.tipo !== "ok") return { ...base, title: "Enlace no disponible" };

  const { equipo } = resultado;
  const { vencidas, proximas } = resumenPendientes(equipo);
  return {
    ...base,
    title: `Equipo ${equipo.codigo} — ${NOMBRES_ESTADO_OPERATIVO[equipo.estado_operativo]}`,
    description:
      vencidas + proximas === 0
        ? "Todas las tareas de mantenimiento al día"
        : `${vencidas} tareas vencidas · ${proximas} próximas a vencer`,
  };
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-sm rounded-xl border border-card-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">{titulo}</h1>
        <p className="mt-2 text-sm text-muted">{texto}</p>
      </div>
    </main>
  );
}

export default async function EquipoPublicoPage(props: PageProps<"/p/[token]">) {
  const { token } = await props.params;
  const resultado = await cargarEquipo(token);

  if (resultado.tipo === "caducado") {
    return (
      <Aviso
        titulo="Este enlace ha caducado"
        texto="Los enlaces de los vehículos duran 7 días. Pide uno nuevo a quien te lo envió."
      />
    );
  }
  if (resultado.tipo === "invalido") {
    return <Aviso titulo="Enlace no válido" texto="Comprueba que el enlace esté completo." />;
  }

  const { equipo } = resultado;
  const { vencidas, proximas } = resumenPendientes(equipo);
  const marcaModelo = [equipo.marca, equipo.modelo, equipo.tipo].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Mantenimiento de Flota · solo lectura
      </p>

      <section className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Equipo {equipo.codigo}</h1>
            {marcaModelo && <p className="text-sm text-muted">{marcaModelo}</p>}
          </div>
          <a
            href={`/api/publico/equipo/${encodeURIComponent(token)}/pdf`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Descargar PDF
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EstadoOperativoBadge estado={equipo.estado_operativo} />
          {equipo.etiquetas.map((asignacion) => (
            <span
              key={asignacion.id}
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ESTILOS_COLOR[asignacion.etiqueta.color]}`}
            >
              {asignacion.etiqueta.nombre}
            </span>
          ))}
          {vencidas > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {vencidas} vencida{vencidas === 1 ? "" : "s"}
            </span>
          )}
          {proximas > 0 && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              {proximas} próxima{proximas === 1 ? "" : "s"} a vencer
            </span>
          )}
          {vencidas + proximas === 0 && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Todo al día
            </span>
          )}
        </div>
        {(equipo.lectura_actual_horas !== null || equipo.lectura_actual_km !== null) && (
          <p className="text-sm text-muted">
            Lectura actual:{" "}
            {[
              equipo.lectura_actual_horas !== null && `${equipo.lectura_actual_horas} h`,
              equipo.lectura_actual_km !== null && `${equipo.lectura_actual_km} km`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-card-border bg-card shadow-sm">
        <h2 className="border-b border-card-border px-5 py-3 font-medium">Tareas de mantenimiento</h2>
        <ul>
          {equipo.estados.map((estado) => (
            <li
              key={estado.tipo_tarea_id}
              className="flex flex-col gap-1 border-t border-card-border/60 px-5 py-3 first:border-t-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{estado.tipo_tarea_nombre}</span>
                <EstadoBadge estado={estado.estado} />
              </div>
              <span className="text-xs text-muted">
                {estado.fecha_ultimo_registro
                  ? `Último: ${formatearFecha(estado.fecha_ultimo_registro)}${
                      estado.usuario_ultimo_registro ? ` — ${estado.usuario_ultimo_registro}` : ""
                    }`
                  : "Sin registros"}
              </span>
              {estado.observaciones_ultimo_registro && (
                <ObservacionAviso texto={estado.observaciones_ultimo_registro} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-card-border bg-card shadow-sm">
        <h2 className="border-b border-card-border px-5 py-3 font-medium">
          Historial ({equipo.historial.length})
        </h2>
        {equipo.historial.length === 0 ? (
          <p className="px-5 py-3 text-sm text-muted">Todavía no hay registros.</p>
        ) : (
          <ul className="max-h-[32rem] overflow-y-auto">
            {equipo.historial.map((registro) => (
              <li
                key={registro.id}
                className="flex flex-col gap-0.5 border-t border-card-border/60 px-5 py-2.5 text-sm first:border-t-0"
              >
                <span className="text-xs text-muted">
                  {formatearFecha(registro.fecha_realizada)} · {registro.tipo_tarea_nombre} ·{" "}
                  {registro.usuario_nombre}
                  {registro.horas_trabajo !== null && ` · ${registro.horas_trabajo} h`}
                  {registro.kilometros !== null && ` · ${registro.kilometros} km`}
                </span>
                {registro.observaciones && <span>{registro.observaciones}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted">
        Enlace de solo lectura, válido hasta el {formatearFecha(equipo.expira)}.
      </p>
    </main>
  );
}
