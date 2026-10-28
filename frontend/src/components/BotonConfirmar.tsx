"use client";

import { useState } from "react";

const CLASE_BOTON =
  "shrink-0 rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium transition-colors";

/** Botón de acción destructiva con confirmación en línea, sin el diálogo
 * nativo confirm() (bloquea la página y en móvil es poco claro). */
export function BotonConfirmar({
  texto,
  pregunta,
  textoConfirmar,
  onConfirmar,
  compacto = false,
}: {
  texto: string;
  pregunta: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  compacto?: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const tamano = compacto ? "px-2 py-1 text-xs" : "";

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className={`${CLASE_BOTON} ${tamano} text-red-600 hover:bg-red-50`}
      >
        {texto}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1">
      <span className="text-sm text-red-700">{pregunta}</span>
      <button
        type="button"
        onClick={() => {
          setConfirmando(false);
          onConfirmar();
        }}
        className={`${CLASE_BOTON} ${tamano} border-red-600 bg-red-600 text-white hover:bg-red-700`}
      >
        {textoConfirmar}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className={`${CLASE_BOTON} ${tamano} bg-card text-muted hover:bg-background`}
      >
        Cancelar
      </button>
    </div>
  );
}
