# Sistema de Control de Mantenimiento Preventivo de Flota

## Contexto

Hoy el control de mantenimiento de 558 vehículos/maquinaria pesada se lleva en 42 plantillas Excel (21 "engrase N" + 21 "mantenimiento N"), una fila por equipo y 12 columnas mensuales × 4 sub-campos, todas vacías. El sistema es 100% manual: sin quién marcó, sin fecha exacta (solo el mes), sin alertas de vencimiento, sin vista consolidada entre los 42 archivos.

Se confirmó con el usuario:
- Los equipos son vehículos/maquinaria pesada (confirma ACEITE/CAJA_C/GRUPO/F_SECANTE como partes mecánicas reales: caja de cambios, diferencial, filtro secante de frenos neumáticos).
- Habrá varios técnicos + un supervisor, con roles distintos.
- No hay histórico que migrar (las plantillas están vacías), pero sí hay que dar de alta el catálogo real de 558 códigos de equipo que ya existen repartidos en los 42 Excel.
- Despliegue en el VPS propio del usuario vía Dokploy + Docker Compose, sin tocar labels de Traefik a mano.

Objetivo: reemplazar las 42 plantillas por una aplicación web (FastAPI + PostgreSQL + Next.js, según el stack obligatorio del usuario) que registre cumplimientos reales por evento, calcule el estado de cada tarea (al día / próximo a vencer / vencido) y dé una vista consolidada por lote y por equipo.

## Enfoque

Aplicación monolítica simple, sin colas ni microservicios. **Sin Redis**: JWT es stateless y el volumen (558 equipos × 8 tareas ≈ 4.464 combinaciones) es trivial para Postgres directo — no se justifica cache. El núcleo del dominio es **un registro por evento real de ejecución de tarea**; el estado de vencimiento se **deriva on-the-fly** en la capa de servicio (última fecha + periodicidad), sin jobs periódicos ni tablas de estado materializadas.

Se recorta deliberadamente del diseño inicial:
- **Sin exportación a PDF** en v1 (solo Excel, que es el formato nativo de origen) — se agrega después si hace falta.
- **Sin endpoint genérico de importación CSV/Excel**: el catálogo inicial de 558 equipos se carga con un **script de seed único** que lee los 42 Excel existentes (ya tienen los códigos reales por lote). Alta de equipos nuevos después del arranque se hace por la UI normal (POST /api/equipos), no hace falta una feature de importación masiva permanente.
- **Sin notificaciones por email** en v1 — el dashboard visual (badges + contador de vencidos) alcanza para un equipo interno pequeño.
- **Sin TanStack Query ni librerías de estado adicionales** en frontend — `fetch` + hooks propios es suficiente a esta escala.

## Dependencias nuevas a instalar (aviso previo, según tus reglas)

**Backend** (`uv add`): `fastapi`, `uvicorn[standard]`, `sqlalchemy>=2.0`, `alembic`, `psycopg[binary]` (driver Postgres), `pydantic-settings`, `pyjwt` (JWT), `bcrypt` (hash de password), `python-multipart` (subida de archivos si hiciera falta), `openpyxl` (leer los 42 Excel de seed y generar export). Dev: `pytest`, `pytest-cov`, `httpx` (TestClient), `ruff`, `black`.

**Frontend** (`npm install`): scaffold estándar de `create-next-app` (Next.js + TypeScript + Tailwind + ESLint) — sin dependencias extra de terceros. Dev: `jest`, `@testing-library/react`, `@testing-library/jest-dom`.

## Modelo de datos (`backend/app/models/`)

- **`Equipo`**: `id`, `codigo` (único, es el número real: 1002...9982), `lote` (1..21), `activo`, `marca`/`modelo`/`tipo` (opcionales, texto libre), timestamps.
- **`TipoTarea`**: catálogo fijo de 8 filas sembradas por migración (data migration de Alembic, no por endpoint): `ACEITE`, `CAJA_C`, `ENGRASE`, `GRUPO` (categoría `engrase`) + `F_GASOIL`, `HIDRAULICO`, `F_AIRE`, `F_SECANTE` (categoría `mantenimiento`). Campo `periodicidad_dias` (default 30, editable por supervisor) vive aquí porque es propiedad de la tarea, no del equipo.
- **`Registro`**: `equipo_id`, `tipo_tarea_id`, `usuario_id`, `fecha_realizada`, `observaciones`. Un registro = un evento real. Índice compuesto `(equipo_id, tipo_tarea_id, fecha_realizada)`.
- **`Usuario`**: `email` (único), `password_hash`, `nombre`, `rol` (`tecnico`|`supervisor`), `activo`.

Estado de una tarea = se deriva del **último `Registro`** de ese par equipo+tarea vs `periodicidad_dias`: `sin_registro` (nunca marcado) / `vencido` / `proximo_a_vencer` (umbral fijo simple en config, ej. 5 días) / `al_dia`. Para listados masivos (dashboard, por lote) se resuelve con una sola query `DISTINCT ON (equipo_id, tipo_tarea_id) ORDER BY fecha_realizada DESC` — sin vista materializada, innecesaria a este volumen.

## Autenticación (`backend/app/core/security.py`, `dependencies.py`)

JWT stateless (pyjwt + bcrypt), sin refresh token en v1 (expiración ~8-12h, equipo interno). Dependencias de FastAPI: `get_current_user`, `require_supervisor` (403 si no es supervisor), `require_autenticado` (cualquier rol). El `usuario_id` de un `Registro` sale siempre del token, nunca del body, para evitar suplantación.

## Endpoints (`backend/app/api/`)

| Recurso | Endpoints | Rol |
|---|---|---|
| `auth` | `POST /api/auth/login`, `GET /api/auth/me` | público / autenticado |
| `equipos` | `GET/POST /api/equipos`, `GET/PATCH/DELETE /api/equipos/{id}` (delete = soft, `activo=False`) | lectura: autenticado; escritura: supervisor |
| `usuarios` | CRUD `/api/usuarios` | supervisor |
| `tipos-tarea` | `GET /api/tipos-tarea`, `PATCH /api/tipos-tarea/{id}` (periodicidad) | lectura: autenticado; escritura: supervisor |
| `registros` | `POST /api/registros`, `GET /api/registros?equipo_id=&tipo_tarea_id=&desde=&hasta=`, `DELETE /api/registros/{id}` (corrección) | crear: cualquier rol autenticado; borrar: supervisor |
| `estado` | `GET /api/estado/equipo/{id}`, `GET /api/estado/lote/{lote}`, `GET /api/estado/mes/{yyyy-mm}` | autenticado |
| `dashboard` | `GET /api/dashboard/resumen` (vencidos, próximos, % cumplimiento por lote) | autenticado |
| `exportaciones` | `GET /api/exportaciones/estado.xlsx?lote=` | autenticado |
| — | `GET /api/health` (chequea conexión BD, para Dokploy) | público |

## Frontend (`frontend/src/`)

Páginas (App Router): `login`, `(dashboard)/page` (métricas + alertas), `(dashboard)/equipos/page` (listado filtrable por lote con badge de estado), `(dashboard)/equipos/[id]/page` (checklist de 8 tareas + historial + botón "marcar realizado"), `(dashboard)/equipos/nuevo/page` (alta manual, supervisor), `(dashboard)/usuarios/page` (gestión, solo supervisor), `(dashboard)/reportes/page` (export Excel por lote).

Reutilizables: `components/EstadoBadge`, `TareaChecklistItem`, `LoteFilterBar`, `EquipoTable`, `MetricCard`, `RoleGate`; `hooks/useAuth`, `useEquipos`, `useEstadoEquipo`, `useDashboard`; `lib/apiClient.ts` (fetch + JWT en cookie httpOnly vía route handler intermediario, manejo de 401 → redirect login); `types/` reflejando 1:1 los schemas Pydantic.

## Infraestructura

`docker-compose.yml` (dev): `backend` (uvicorn --reload), `frontend` (next dev), `db` (postgres:16-alpine, healthcheck `pg_isready`). Producción vía Dokploy: Dockerfiles multi-stage, variables de entorno por su panel (`DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`), `alembic upgrade head` como paso de arranque del contenedor backend, sin tocar Traefik.

Bootstrap del primer usuario supervisor: script `backend/app/scripts/create_admin.py` que lee `ADMIN_EMAIL`/`ADMIN_PASSWORD` de variables de entorno (no hay registro público).

## Fases de trabajo (TDD, orden de dependencia)

1. **Setup**: estructura `backend/` (`app/api|core|models|services|repositories|tests`) y `frontend/` (`src/app|components|lib|hooks|types`), `pyproject.toml` (uv/black/ruff/pytest), `package.json`, `docker-compose.yml`, Alembic init, `git init` con ramas `main`/`develop`. Sin tests (setup puro).
2. **Modelo + migraciones**: modelos SQLAlchemy, migración inicial, migración de seed del catálogo de 8 tareas. Tests: seed inserta exactamente 8 tareas con categoría correcta; constraints de unicidad (`codigo`, `email`) lanzan `IntegrityError`.
3. **Auth**: hash/JWT, dependencias de rol, `login`/`me`. Tests: hash/verify; JWT válido/expirado/manipulado; `require_supervisor` rechaza técnico y acepta supervisor; login inválido → 401.
4. **Equipos + script de seed desde los 42 Excel** (copiados a `backend/seed_data/`). Tests: parser detecta código duplicado y asigna lote correcto desde el nombre de archivo; reglas de negocio de alta (no el CRUD trivial de GET/PATCH/DELETE en sí).
5. **Registros + `estado_service`** (el corazón del dominio). Tests: cálculo de `al_dia`/`proximo_a_vencer`/`vencido`/`sin_registro` con distintas fechas/periodicidades y casos límite (exactamente en el umbral); POST `/api/registros` usa el `usuario_id` del token, no del body.
6. **Dashboard + estado por lote/mes** (depende de 5). Tests: agregación % cumplimiento por lote (casos 0 equipos, todos vencidos, mezcla); estado por mes replica semántica de "un mes = un evento dentro de ese mes calendario" de las plantillas originales.
7. **Exportación Excel** (depende de 6). Tests: transformación de datos de estado al formato de filas/columnas del export (no testear openpyxl en sí).
8. **Usuarios** (depende de 3). Tests: técnico no puede autopromoverse ni crear usuarios; CRUD trivial sin test.
9. **Frontend**: login/equipos en paralelo con fase 3-4; checklist/dashboard/reportes tras fase 5-7. Tests (Jest+RTL): `EstadoBadge` colores/texto por estado; `useAuth` maneja token expirado; formulario de marcado envía payload correcto y maneja error de API; `RoleGate` oculta contenido a técnico.
10. **Despliegue**: Dockerfiles de producción, healthcheck, variables de entorno, despliegue de prueba en Dokploy.

## Archivos críticos

- `backend/app/models/registro.py` y `tipo_tarea.py` — corazón del dominio.
- `backend/app/services/estado_service.py` — única regla de negocio no trivial (cálculo de vencimiento).
- `backend/app/api/registros.py` — control de rol/usuario en el marcado de cumplimiento.
- `backend/app/scripts/seed_equipos.py` — parser de los 42 Excel originales al catálogo real.
- `frontend/src/hooks/useEstadoEquipo.ts` y `components/EstadoBadge.tsx` — reflejan la lógica de estado en UI.
- `docker-compose.yml` — base para adaptar a Dokploy.

## Verificación end-to-end

1. `docker compose up -d` → `GET /api/health` responde 200 con conexión a BD.
2. Ejecutar `create_admin.py` → login vía `POST /api/auth/login` devuelve JWT válido.
3. Ejecutar `seed_equipos.py` sobre los 42 Excel → `GET /api/equipos` devuelve 558 equipos repartidos en 21 lotes.
4. Marcar un cumplimiento (`POST /api/registros`) para un equipo/tarea → `GET /api/estado/equipo/{id}` refleja `al_dia`; forzar fecha antigua y confirmar que pasa a `vencido`.
5. `GET /api/dashboard/resumen` refleja el cambio anterior en el conteo de vencidos.
6. Backend: `uv run pytest` (todas las fases con test) + `ruff check .` + `black --check .`.
7. Frontend: `npm run test`, `npm run lint`, y verificación manual en navegador del flujo login → dashboard → detalle de equipo → marcar tarea.
