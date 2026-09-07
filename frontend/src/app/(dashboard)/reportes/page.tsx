"use client";

import { useState } from "react";

import { LoteFilterBar } from "@/components/LoteFilterBar";

export default function ReportesPage() {
  const [lote, setLote] = useState<number | undefined>(undefined);
  const query = lote !== undefined ? `?lote=${lote}` : "";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Reportes</h1>
      <LoteFilterBar loteSeleccionado={lote} onCambiarLote={setLote} />
      <a
        href={`/api/exportaciones/estado.xlsx${query}`}
        className="w-fit rounded bg-black px-3 py-2 text-sm text-white"
      >
        Descargar estado en Excel
      </a>
    </div>
  );
}
