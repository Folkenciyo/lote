import { ImageResponse } from "next/og";

export const NOMBRE_APP = "Mantenimiento de Flota";
export const NOMBRE_CORTO_APP = "Flota";
export const COLOR_TEMA = "#0f172a";
export const COLOR_ICONO = "#4f46e5";

// El camión ocupa el 60% central: Android recorta los iconos adaptativos
// ("maskable") a un círculo o squircle dentro de esa zona segura.
const PROPORCION_GLIFO = 0.6;

export function iconoApp(lado: number): ImageResponse {
  const glifo = Math.round(lado * PROPORCION_GLIFO);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLOR_ICONO,
        }}
      >
        <svg
          width={glifo}
          height={glifo}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={1.8}
          strokeLinejoin="round"
        >
          <rect x="1" y="6" width="13" height="10" rx="1.2" />
          <path d="M14 10h4l4 3.5V16h-8z" />
          <circle cx="6" cy="18" r="1.8" />
          <circle cx="17" cy="18" r="1.8" />
        </svg>
      </div>
    ),
    { width: lado, height: lado }
  );
}
