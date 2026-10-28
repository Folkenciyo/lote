"use client";

import { useEffect, useState } from "react";

import { IconDownload, IconMail, IconWhatsapp } from "@/components/icons";
import { apiClient, ApiError } from "@/lib/apiClient";
import { construirMensajeEquipo } from "@/lib/compartir";
import { Equipo, EstadoTarea } from "@/types";

interface EnlaceCompartido {
  token: string;
  expira: string;
}

const CLASE_BOTON =
  "flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background disabled:opacity-60";

function puedeCompartirArchivos(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  const prueba = new File([""], "prueba.pdf", { type: "application/pdf" });
  return navigator.canShare({ files: [prueba] });
}

export function CompartirEquipo({ equipo, estados }: { equipo: Equipo; estados: EstadoTarea[] }) {
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compartirArchivos, setCompartirArchivos] = useState(false);
  // Safari exige llamar a navigator.share() casi en el mismo instante del
  // toque; si descargar el PDF tarda demasiado, se guarda y se pide un segundo toque.
  const [pdfListo, setPdfListo] = useState<{ archivo: File; mensaje: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompartirArchivos(puedeCompartirArchivos());
  }, []);

  const prepararMensaje = async (): Promise<string> => {
    const enlace = await apiClient.post<EnlaceCompartido>(`/compartir/equipo/${equipo.id}`);
    const url = `${window.location.origin}/p/${enlace.token}`;
    return construirMensajeEquipo(equipo, estados, url, enlace.expira);
  };

  const conManejoDeErrores = async (accion: () => Promise<void>) => {
    setPreparando(true);
    setError(null);
    try {
      await accion();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo preparar el envío");
    } finally {
      setPreparando(false);
    }
  };

  const compartirWhatsapp = () => {
    // Se abre la pestaña dentro del clic: si se abriera tras el await, el
    // navegador la bloquearía como ventana emergente.
    const ventana = window.open("", "_blank");
    conManejoDeErrores(async () => {
      try {
        const mensaje = await prepararMensaje();
        const destino = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        if (ventana) {
          ventana.opener = null;
          ventana.location.href = destino;
        } else {
          window.location.href = destino;
        }
      } catch (err) {
        ventana?.close();
        throw err;
      }
    });
  };

  const compartirEmail = () =>
    conManejoDeErrores(async () => {
      const mensaje = await prepararMensaje();
      const asunto = `Parte de mantenimiento - Equipo ${equipo.codigo}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
    });

  const compartirPdf = async (archivo: File, mensaje: string) => {
    try {
      await navigator.share({ files: [archivo], title: `Equipo ${equipo.codigo}`, text: mensaje });
      setPdfListo(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPdfListo({ archivo, mensaje });
      } else if (!(err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
    }
  };

  const enviarPdf = () => {
    if (pdfListo) {
      conManejoDeErrores(() => compartirPdf(pdfListo.archivo, pdfListo.mensaje));
      return;
    }
    conManejoDeErrores(async () => {
      const [mensaje, respuesta] = await Promise.all([
        prepararMensaje(),
        fetch(`/api/exportaciones/equipo/${equipo.id}.pdf`),
      ]);
      if (!respuesta.ok) throw new Error("No se pudo generar el PDF");
      const archivo = new File([await respuesta.blob()], `equipo-${equipo.codigo}.pdf`, {
        type: "application/pdf",
      });
      await compartirPdf(archivo, mensaje);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <a href={`/api/exportaciones/equipo/${equipo.id}.pdf`} className={CLASE_BOTON}>
          <IconDownload className="h-4 w-4" />
          Descargar PDF
        </a>
        {compartirArchivos && (
          <button
            type="button"
            onClick={enviarPdf}
            disabled={preparando}
            className={`${CLASE_BOTON} ${pdfListo ? "border-green-300 bg-green-50 text-green-700" : ""}`}
          >
            <IconDownload className="h-4 w-4" />
            {pdfListo ? "PDF listo — pulsa para enviar" : "Enviar PDF"}
          </button>
        )}
        <button
          type="button"
          onClick={compartirWhatsapp}
          disabled={preparando}
          className={`${CLASE_BOTON} text-green-700`}
        >
          <IconWhatsapp className="h-4 w-4" />
          WhatsApp
        </button>
        <button type="button" onClick={compartirEmail} disabled={preparando} className={CLASE_BOTON}>
          <IconMail className="h-4 w-4" />
          Email
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
