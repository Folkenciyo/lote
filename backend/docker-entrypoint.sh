#!/bin/sh
set -e

# Cada paso es idempotente: un redeploy o reinicio del contenedor es seguro.
echo "==> Aplicando migraciones"
uv run alembic upgrade head

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "==> Creando el primer supervisor (si no existe)"
  uv run python -m app.scripts.create_admin
fi

echo "==> Sembrando el catalogo de equipos desde los Excel (upsert)"
uv run python -m app.scripts.seed_equipos

echo "==> Iniciando API"
exec "$@"
