import Link from "next/link";

import { Equipo } from "@/types";

export function EquipoTable({ equipos }: { equipos: Equipo[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-black/10">
          <th className="py-2">Código</th>
          <th className="py-2">Lote</th>
          <th className="py-2">Marca</th>
          <th className="py-2">Modelo</th>
        </tr>
      </thead>
      <tbody>
        {equipos.map((equipo) => (
          <tr key={equipo.id} className="border-b border-black/5">
            <td className="py-2">
              <Link href={`/equipos/${equipo.id}`} className="underline">
                {equipo.codigo}
              </Link>
            </td>
            <td className="py-2">{equipo.lote}</td>
            <td className="py-2">{equipo.marca ?? "-"}</td>
            <td className="py-2">{equipo.modelo ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
