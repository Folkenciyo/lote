// Service worker mínimo para que la app sea instalable. No cachea páginas ni
// datos de la API a propósito: el estado de la flota tiene que verse siempre
// actualizado. Solo muestra un aviso si se abre la app sin conexión.

const PAGINA_SIN_CONEXION = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión — Mantenimiento de Flota</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: system-ui, sans-serif; background: #f1f5f9; color: #0f172a; text-align: center; padding: 16px; }
  button { margin-top: 16px; padding: 10px 18px; border: 0; border-radius: 8px; background: #4f46e5;
    color: #fff; font-size: 15px; font-weight: 600; }
</style>
</head>
<body>
  <div>
    <h1 style="font-size: 20px">Sin conexión</h1>
    <p>No hay conexión a internet. Los datos de mantenimiento necesitan red para estar al día.</p>
    <button onclick="location.reload()">Reintentar</button>
  </div>
</body>
</html>`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(PAGINA_SIN_CONEXION, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
    )
  );
});
