"use client";

import { HistoricoReporte } from "@/components/HistoricoReporte";
import { IconDownload } from "@/components/icons";

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Reportes</h1>
      <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
        <div>
          <h2 className="font-medium">Estado de mantenimiento</h2>
          <p className="text-sm text-muted">Exporta el estado de cada tarea a Excel</p>
        </div>
        <a
          href="/api/exportaciones/estado.xlsx"
          className="flex w-fit items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <IconDownload className="h-4 w-4" />
          Descargar Excel
        </a>
      </div>

      <HistoricoReporte />
    </div>
  );
}
