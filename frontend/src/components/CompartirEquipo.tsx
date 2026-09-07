"use client";

import { IconDownload, IconMail, IconWhatsapp } from "@/components/icons";
import { Equipo } from "@/types";

function construirResumenTexto(equipo: Equipo, url: string): string {
  return `Equipo ${equipo.codigo} (Lote ${equipo.lote}) - Mantenimiento de Flota\nVer detalle y descargar PDF: ${url}`;
}

export function CompartirEquipo({ equipo }: { equipo: Equipo }) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const mensaje = construirResumenTexto(equipo, url);

  const compartirWhatsapp = () => {
    const enlace = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(enlace, "_blank", "noopener,noreferrer");
  };

  const compartirEmail = () => {
    const asunto = `Ficha de mantenimiento - Equipo ${equipo.codigo}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/exportaciones/equipo/${equipo.id}.pdf`}
        className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background"
      >
        <IconDownload className="h-4 w-4" />
        Descargar PDF
      </a>
      <button
        type="button"
        onClick={compartirWhatsapp}
        className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-background"
      >
        <IconWhatsapp className="h-4 w-4" />
        WhatsApp
      </button>
      <button
        type="button"
        onClick={compartirEmail}
        className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background"
      >
        <IconMail className="h-4 w-4" />
        Email
      </button>
    </div>
  );
}

