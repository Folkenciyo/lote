import type { MetadataRoute } from "next";

import { COLOR_TEMA, NOMBRE_APP, NOMBRE_CORTO_APP } from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOMBRE_APP,
    short_name: NOMBRE_CORTO_APP,
    description: "Control de mantenimiento preventivo de la flota",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1f5f9",
    theme_color: COLOR_TEMA,
    icons: [192, 512].flatMap((lado) =>
      (["any", "maskable"] as const).map((purpose) => ({
        src: `/icon/${lado}`,
        sizes: `${lado}x${lado}`,
        type: "image/png",
        purpose,
      }))
    ),
  };
}
