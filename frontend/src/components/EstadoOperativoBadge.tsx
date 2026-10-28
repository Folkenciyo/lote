import { EstadoOperativo } from "@/types";

export const NOMBRES_ESTADO_OPERATIVO: Record<EstadoOperativo, string> = {
  activo: "Activo",
  taller: "En taller",
  averiado: "Averiado",
  baja: "De baja",
};

const ESTILOS: Record<EstadoOperativo, string> = {
  activo: "bg-green-100 text-green-700",
  taller: "bg-amber-100 text-amber-700",
  averiado: "bg-orange-100 text-orange-700",
  baja: "bg-black/10 text-muted",
};

export function EstadoOperativoBadge({ estado }: { estado: EstadoOperativo }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTILOS[estado]}`}>
      {NOMBRES_ESTADO_OPERATIVO[estado]}
    </span>
  );
}
