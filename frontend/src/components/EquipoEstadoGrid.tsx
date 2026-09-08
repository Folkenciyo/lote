import Link from "next/link";

import { Equipo, EstadoOperativo } from "@/types";

const ESTILOS_ESTADO: Record<EstadoOperativo, string> = {
  activo: "bg-green-100 text-green-700 border-green-200",
  taller: "bg-amber-100 text-amber-700 border-amber-200",
  averiado: "bg-orange-100 text-orange-700 border-orange-200",
  baja: "bg-black/10 text-muted border-black/10",
};

export function EquipoEstadoGrid({ equipos }: { equipos: Equipo[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
      {equipos.map((equipo) => (
        <Link
          key={equipo.id}
          href={`/equipos/${equipo.id}`}
          title={`${equipo.codigo} — ${equipo.activo ? "Activo" : "Archivado"}${
            equipo.estado_operativo !== "activo" ? ` / ${equipo.estado_operativo}` : ""
          }`}
          className={`rounded-lg border px-2 py-2 text-center text-xs font-medium shadow-sm transition-transform hover:scale-105 ${
            equipo.activo ? ESTILOS_ESTADO[equipo.estado_operativo] : ESTILOS_ESTADO.baja
          }`}
        >
          {equipo.codigo}
        </Link>
      ))}
    </div>
  );
}
