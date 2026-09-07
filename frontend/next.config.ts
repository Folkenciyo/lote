import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
