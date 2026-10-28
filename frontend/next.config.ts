import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // El navegador debe comprobar siempre si hay un sw.js nuevo tras cada deploy.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
  // Solo se usa en el contenedor de desarrollo (next dev --webpack): el bind
  // mount sobre Windows no dispara los eventos de archivo que Turbopack espera.
  ...(process.env.WATCH_POLLING === "true"
    ? {
        webpack: (config) => {
          config.watchOptions = { poll: 1000, aggregateTimeout: 300 };
          return config;
        },
      }
    : {}),
};

export default nextConfig;
