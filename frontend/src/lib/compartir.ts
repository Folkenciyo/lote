import { NOMBRES_ESTADO_OPERATIVO } from "@/components/EstadoOperativoBadge";
import { Equipo, EstadoTarea } from "@/types";

type EquipoMensaje = Pick<Equipo, "codigo" | "marca" | "modelo" | "estado_operativo">;

/** "2026-03-05" → "05/03/2026"; una fecha-hora ISO se muestra en hora peninsular. */
export function formatearFecha(fecha: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Madrid",
  });
}

function plural(cantidad: number, singular: string, pluralTexto: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

function lineaPendientes(estados: EstadoTarea[]): string {
  const vencidas = estados.filter((e) => e.estado === "vencido").length;
  const proximas = estados.filter((e) => e.estado === "proximo_a_vencer").length;
  if (vencidas === 0 && proximas === 0) return "✓ Todas las tareas al día";
  const partes = [];
  if (vencidas > 0) partes.push(plural(vencidas, "tarea vencida", "tareas vencidas"));
  if (proximas > 0) partes.push(plural(proximas, "próxima a vencer", "próximas a vencer"));
  return `⚠ ${partes.join(" · ")}`;
}

function lineaUltimaObservacion(estados: EstadoTarea[]): string | null {
  const conObservacion = estados
    .filter((e) => e.observaciones_ultimo_registro && e.fecha_ultimo_registro)
    .sort((a, b) => (b.fecha_ultimo_registro ?? "").localeCompare(a.fecha_ultimo_registro ?? ""));
  const ultima = conObservacion[0];
  if (!ultima) return null;
  return `Última observación (${ultima.tipo_tarea_nombre}, ${formatearFecha(
    ultima.fecha_ultimo_registro as string
  )}): ${ultima.observaciones_ultimo_registro}`;
}

export function construirMensajeEquipo(
  equipo: EquipoMensaje,
  estados: EstadoTarea[],
  url: string,
  expira: string
): string {
  const marcaModelo = [equipo.marca, equipo.modelo].filter(Boolean).join(" ");
  const lineas = [
    `Equipo ${equipo.codigo} — ${NOMBRES_ESTADO_OPERATIVO[equipo.estado_operativo]}`,
    marcaModelo || null,
    lineaPendientes(estados),
    lineaUltimaObservacion(estados),
    "",
    `Ver estado y descargar PDF (enlace válido hasta el ${formatearFecha(expira)}):`,
    url,
  ];
  return lineas.filter((linea) => linea !== null).join("\n");
}
