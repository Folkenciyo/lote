"use client";

import { useEffect } from "react";

export function RegistrarServiceWorker() {
  useEffect(() => {
    // Solo en producción: en desarrollo un service worker activo interfiere
    // con la recarga en caliente.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Sin service worker la app sigue funcionando; solo no es instalable.
      });
  }, []);

  return null;
}
