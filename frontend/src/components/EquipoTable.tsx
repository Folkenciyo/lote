import Link from "next/link";

import { Equipo } from "@/types";

export function EquipoTable({ equipos }: { equipos: Equipo[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted">
            <th className="px-5 py-3 font-medium">Código</th>
            <th className="px-5 py-3 font-medium">Lote</th>
            <th className="px-5 py-3 font-medium">Marca</th>
            <th className="px-5 py-3 font-medium">Modelo</th>
            <th className="px-5 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((equipo) => (
            <tr key={equipo.id} className="border-t border-card-border/60 hover:bg-background/60">
              <td className="px-5 py-2.5">
                <Link href={`/equipos/${equipo.id}`} className="font-medium text-primary hover:underline">
                  {equipo.codigo}
                </Link>
              </td>
              <td className="px-5 py-2.5">{equipo.lote}</td>
              <td className="px-5 py-2.5">{equipo.marca ?? "-"}</td>
              <td className="px-5 py-2.5">{equipo.modelo ?? "-"}</td>
              <td className="px-5 py-2.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    equipo.activo ? "bg-green-100 text-green-700" : "bg-black/5 text-muted"
                  }`}
                >
                  {equipo.activo ? "Activo" : "Archivado"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
