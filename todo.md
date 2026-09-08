# TODO — Sistema de mantenimiento de flota

Pendientes acordados con el usuario (2026-09-08). Estado actualizado tras la
primera vuelta de implementación (misma fecha).

## Bug corregido (2026-09-08): "Archivar equipo" daba error interno de servidor

Reportado por el usuario. Causa real: `frontend/src/app/api/[...path]/route.ts`
(el proxy de Next hacia el backend) construía `new NextResponse(body, {status})`
pasando siempre un `ArrayBuffer` como body — pero el estándar Fetch prohíbe
pasar body (aunque esté vacío) en respuestas con status 204/205/304/101/103,
y lanza `TypeError` al construirla. El backend (`DELETE /api/equipos/{id}`)
respondía 204 correctamente y **sí archivaba el equipo**, pero el proxy
petaba al reenviar esa respuesta al navegador, así que el usuario veía un 500
aunque la acción ya se hubiera guardado. Corregido devolviendo `null` como
body cuando el status es uno de esos. Verificado en navegador (ya no da
error) y confirmado en la base de datos que dos equipos habían quedado
archivados de pruebas anteriores del usuario pese al error visible (no se han
tocado, son datos reales del usuario).

## 1. Buscador por código de vehículo — ✅ hecho

- `GET /api/equipos?codigo=` (`backend/app/api/equipos.py`) filtra por código
  parcial (`ILIKE`). Input de búsqueda con debounce de 300ms en
  `frontend/src/app/(dashboard)/equipos/page.tsx`. Verificado en navegador.

## 2. Vista de histórico de vehículo — ✅ hecho (alcance definido con el usuario)

El usuario pidió, más allá de lo que ya existía por equipo: una tabla general
filtrable por año, equipo y tarea, con descarga en PDF.

- Nuevo componente `frontend/src/components/HistoricoReporte.tsx`, integrado en
  `/reportes`. Filtros: buscador de equipo por código (autocompletado), select
  de tarea (`GET /api/tipos-tarea`, endpoint nuevo), año (mapea a
  `desde`/`hasta` sobre `GET /api/registros`, que ya soportaba esos filtros).
- Descarga PDF: `GET /api/exportaciones/historial.pdf` (mismos filtros),
  `generar_pdf_historial` en `pdf_service.py`. Verificado con curl (PDF válido)
  y desde el navegador.
- La vista de histórico **por equipo individual** (`HistorialEquipo.tsx` en la
  ficha de cada equipo) sigue existiendo tal cual, sin tocar — cubre otro caso
  de uso (ver todo el historial de un vehículo concreto sin filtrar).

## 3. Trazabilidad de usuarios (quién hizo qué) — ✅ hecho

- `Registro.usuario_id` ya cubría "quién hizo cada acción".
- Añadido `Equipo.creado_por_id` (migración `9f0decf73391`) + `creado_por_nombre`
  en `EquipoOut`. Se rellena automáticamente al crear un equipo desde
  `POST /api/equipos`. Visible en la ficha del equipo ("Alta registrada por
  ..."). Verificado en navegador.

## 4. Observaciones / notas — ✅ hecho

- `Registro.observaciones` ya existía (por acción de mantenimiento).
- Añadido `Equipo.observaciones` (misma migración `9f0decf73391`) — notas
  generales del vehículo, editables desde su ficha (`EquipoInfoForm.tsx`).

## 5. Aviso de mantenimiento vencido (cada 6 meses) — ⚠️ parcial: banner hecho, email pendiente

Decisión del usuario: las 4 tareas de categoría "mantenimiento" (F_GASOIL,
HIDRAULICO, F_AIRE, F_SECANTE) son las que deben cumplirse cada 6 meses — las
de "engrase" siguen siendo mensuales. Migración de datos `fd082b2dc3ee` cambió
su `periodicidad_dias` de 30 a 180.

- **Hecho:** banner rojo en `frontend/src/components/AvisoMantenimientoBanner.tsx`,
  visible en todas las páginas del dashboard (`layout.tsx`), alimentado por
  `GET /api/dashboard/avisos-mantenimiento` (nuevo endpoint, ignora las tareas
  de engrase). Verificado en navegador con un caso real vencido.
- **Pendiente:** canal por email — el usuario ya dijo explícitamente "de
  momento no, solo dejarlo preparado" para SMTP en la sesión anterior. No se
  ha tocado. Retomar cuando se decida proveedor.

## 7. Estado del vehículo (activo / taller / baja / averiado) + registro de cambios — ✅ hecho

Pedido por el usuario (2026-09-08, segunda vuelta, ampliado más tarde con
"averiado"). Distinto de "archivar":

- **Archivar equipo — ya existía.** `Equipo.activo` (bool) + botón "Archivar
  equipo"/"Reactivar equipo" en `EquipoInfoForm.tsx`, endpoint
  `DELETE /api/equipos/{id}` (soft, no borra la fila). No hizo falta tocarlo.
- **Nuevo, implementado:** `Equipo.estado_operativo` (`"activo" | "taller" |
  "baja" | "averiado"`, default `"activo"`) + tabla `cambios_estado_equipo`
  (específica, no la auditoría genérica del punto 13 — habría sido
  sobre-ingeniería para
  un solo caso de uso). Migración `aabdc6e0553b`.
- Endpoints en `app/api/equipos.py`: `POST /api/equipos/{id}/estado`
  (`require_supervisor`, valida contra `ESTADOS_OPERATIVOS`, solo escribe en
  `cambios_estado_equipo` si el estado realmente cambia) y
  `GET /api/equipos/{id}/cambios-estado` (lectura para cualquier
  autenticado).
- **Decisión del usuario:** los avisos de mantenimiento/engrase y el
  dashboard **cuentan los equipos "en taller" pero excluyen los "de baja"**.
  Aplicado en `estado_service.estado_lote` y
  `dashboard_service.avisos_categoria` (filtro `estado_operativo != "baja"`,
  junto al `activo == True` que ya existía).
- Frontend: `EstadoOperativoEquipo.tsx` en la ficha del equipo — badge de
  estado, formulario de cambio con motivo opcional (solo supervisor) e
  historial de cambios (visible para todos). `EquipoTable.tsx` muestra un
  badge "En taller"/"De baja"/"Averiado" junto al de Activo/Archivado cuando
  no está en "activo". Verificado en navegador con los tres roles.
- **Estado "averiado" añadido (2026-09-08, cuarta vuelta), color naranja**
  (`bg-orange-100`, distinto del ámbar de "taller"). Por defecto se trata
  igual que "taller" en avisos/dashboard (**cuenta**, no se excluye como
  "baja") — decisión tomada por mí sin bloquear en pregunta al usuario, ya
  que es simétrica a la de "taller" ya decidida; si se prefiere que "averiado"
  se excluya como "baja", es un cambio de una línea en
  `estado_service.py`/`dashboard_service.py` (añadir `estado_operativo not in
  ("baja", "averiado")`). Verificado con curl real end-to-end (backend 100
  tests, frontend tipos/lint/12 tests limpios).

## 8. Horas de trabajo y kilómetros totales, por tarea — ✅ hecho (registro + 9c)

Pedido por el usuario (2026-09-08, segunda vuelta). `Registro` ahora guarda,
además de la fecha, una lectura acumulada del vehículo en el momento de la
tarea (como decidió el usuario: odómetro/horómetro, no incremento desde el
registro anterior).

- `Registro.horas_trabajo`, `Registro.kilometros` (`int | None`) — migración
  `3d8d1b1ec609`. `RegistroCreate`/`RegistroOut` y `POST`/`GET /api/registros`
  actualizados.
- Frontend: `TareaChecklistItem.tsx` tiene dos campos numéricos opcionales
  (Horas, Km) junto a Observaciones al marcar una tarea. Columnas nuevas en
  `HistorialEquipo.tsx` y `HistoricoReporte.tsx`. **No** se tocaron los PDF
  (`generar_pdf_equipo`/`generar_pdf_historial`) — añadir columnas ahí
  obligaba a rehacer el ancho de las tablas existentes, y no se pidió
  explícitamente; se puede retomar si hace falta.
- **9c hecho (tanda 3, 2026-09-08).** Decisión del usuario: campo editable en
  la ficha del vehículo, actualizable por técnico o supervisor (no solo
  supervisor, a diferencia del resto de datos del equipo).
  - `Equipo.lectura_actual_horas`, `Equipo.lectura_actual_km` — migración
    `bfdfcba3e0c3`. Endpoint propio `PATCH /api/equipos/{id}/lectura`
    (`require_autenticado`, no `require_supervisor` — a propósito, cualquiera
    autenticado puede actualizarla). Frontend: `LecturaActualEquipo.tsx` en la
    ficha del equipo, sin `RoleGate`.
  - `TipoTarea.limite_horas` — migración `06fc9d98e49a`. Editable en
    Configuración (`TareasConfig.tsx`, columna nueva) y en el alta de tarea.
  - `estado_service.combinar_estado_con_horas`: una tarea vence por lo que
    llegue primero, días u horas — si no hay `limite_horas` configurado o no
    hay `lectura_actual_horas`, se ignora y manda el cálculo por días de
    siempre. Aplicado en `estado_equipo`, `estado_lote` y
    `dashboard_service.avisos_categoria` (así que el banner también detecta
    vencidos por horas).
  - **Bug real encontrado y corregido de paso:** `ultimos_registros_por_par`
    no desempataba por `id` cuando dos registros de la misma tarea caían en
    la misma fecha — Postgres podía devolver cualquiera de los dos como "el
    último", así que a veces se usaban las horas de un registro viejo en vez
    del más reciente. Corregido añadiendo `Registro.id.desc()` como segundo
    criterio de orden (mismo criterio que ya usaban `HistorialEquipo`/
    `HistoricoReporte` en el frontend). Test de regresión añadido.
  - Verificado end-to-end con curl real: tarea al día por fecha pasó a
    "vencido" al superar el límite de horas configurado, y volvió a
    reflejarse correctamente tras el fix del desempate.

## 9. Apartado "Configuración" en el menú, solo visible para admin — ✅ hecho (salvo 9c)

Pedido por el usuario (2026-09-08, segunda vuelta). Nuevo item en el sidebar
(`frontend/src/app/(dashboard)/layout.tsx`, mismo patrón que ya usa
`RoleGate rol="supervisor"` para ocultar "Usuarios" a los técnicos) que agrupe:

**Estado: ✅ hecho (tanda 1, 2026-09-08)**, salvo 9c que queda aparte.

- **Menú "Configuración"** (`frontend/src/app/(dashboard)/layout.tsx`), solo
  visible con `RoleGate rol="supervisor"` (no existe un rol "admin" separado
  en la app — `ROLES = ("tecnico", "supervisor")` — así que "admin" aquí es
  el usuario supervisor, igual que en el resto de la app). Nueva página
  `/configuracion` con: una tarjeta que enlaza a "Gestión de usuarios"
  (**no se movió** `/usuarios`, se dejó como estaba y se enlaza desde aquí,
  para no arriesgar el nav existente) y la tabla de tareas descrita abajo.
- **Gestión de usuarios** — el CRUD completo ya existía en
  `backend/app/api/usuarios.py` y `/usuarios`, sin cambios; solo se enlaza
  desde Configuración.
- **9c. Límite de horas de trabajo por tarea — queda fuera, sigue pendiente
  de una decisión más.** Depende del punto 8 (horas/km por tarea, tanda 2):
  para que un límite de horas sirva de algo hace falta saber la lectura
  *actual* del horómetro de cada vehículo, no solo la que quedó registrada en
  el último servicio — y hoy no hay ningún sitio que guarde esa lectura
  actual. No se ha construido.
- **CRUD de tipos de tarea — hecho.** `TipoTareaCreate` nuevo, `TipoTareaUpdate`
  ampliado (antes solo `periodicidad_dias`, ahora también `nombre`/`categoria`
  opcionales) en `app/models/tipo_tarea.py`. Router `tipos_tarea.py` con
  `POST`/`PATCH` (`require_supervisor`, valida categoría contra `CATEGORIAS`,
  nombre único). Frontend: `TareasConfig.tsx` — tabla con periodicidad
  editable inline (guarda al perder el foco) + formulario para crear tarea
  nueva. Verificado en navegador: creación y edición de periodicidad
  funcionando de verdad contra el backend.

## 11. Aviso extra de engrase mensual — ✅ hecho

Pedido por el usuario (2026-09-08, tercera vuelta): además del aviso de
mantenimiento semestral (punto 5), un aviso de que **todos** los vehículos
necesitan un engrase una vez al mes. Mismo mecanismo que el punto 5 pero para
la categoría "engrase" en vez de "mantenimiento":

- `TipoTarea.periodicidad_dias` de las 4 tareas de "engrase" ya estaba en 30
  (no hizo falta migración de datos).
- `dashboard_service.avisos_mantenimiento` se generalizó a
  `avisos_categoria(db, categoria)` (dataclass `AvisoCategoria`), reutilizada
  para "mantenimiento" y "engrase". `GET /api/dashboard/avisos-mantenimiento`
  (se mantuvo la URL para no romper nada) ahora devuelve
  `{mantenimiento: {...}, engrase: {...}}`.
- **Decisión del usuario:** mismo banner, una línea más — no uno separado.
  `AvisoMantenimientoBanner.tsx` ahora renderiza una línea por categoría,
  solo si esa categoría tiene vencidos.

## 12. Lista de elementos/repuestos por vehículo, con referencia única — ✅ hecho

Pedido por el usuario (2026-09-08, tercera vuelta). Cada vehículo tiene una
lista editable de elementos (carburador, filtros, marca de aceite, etc.), cada
uno con una referencia — para poder mirarla o sacarla en PDF al pedir
repuestos.

- Modelo `Elemento` (`app/models/elemento.py`) + migración `efba549f42b9`:
  tabla `elementos` con `equipo_id` (FK), `nombre`, `referencia`,
  `observaciones`, restricción única `(equipo_id, referencia)` — la
  referencia es única *dentro de la lista de cada equipo*, como se decidió
  (no catálogo compartido; dos equipos pueden repetir referencia sin
  problema, verificado con test).
- Endpoints en `app/api/elementos.py`: `GET`/`POST /api/equipos/{id}/elementos`
  y `PATCH`/`DELETE /api/elementos/{id}` — lectura para cualquier
  autenticado, escritura solo `require_supervisor`.
- Exportación PDF: `GET /api/exportaciones/equipo/{id}/elementos.pdf`
  (`generar_pdf_elementos` en `pdf_service.py`).
- Frontend: `ElementosEquipo.tsx`, nueva sección en la ficha del equipo —
  tabla + botón "Descargar PDF" visibles para cualquiera, formulario de alta
  y botón "Eliminar" solo con `RoleGate rol="supervisor"`.
- Verificado en navegador con los tres roles: supervisor crea/lista/elimina,
  técnico solo ve la lista y el PDF (sin formulario ni botón eliminar), PDF
  descargado y válido.

## 14. Vista general de estado de vehículos en varias columnas — ✅ hecho

Pedido por el usuario (2026-09-08, cuarta vuelta). Implementado directo (el
usuario indicó que no hacía falta preguntar): alternativa de vista dentro de
`/equipos` (toggle "Tabla"/"Estados" junto al filtro de lote), no página
aparte. `EquipoEstadoGrid.tsx` — mosaico de códigos agrupado por lote (con
contador), color según `estado_operativo`/`activo` (mismos colores que
`EquipoTable.tsx`), cada tile enlaza a la ficha del equipo. No hizo falta
backend nuevo. Verificado con navegador real (559 equipos, 21 lotes,
agrupación y colores correctos).

## 15. Buscador multi-código (varios vehículos a la vez) — ✅ hecho

Pedido por el usuario (2026-09-08, cuarta vuelta). **Decisión del usuario:
coincidencia parcial (ILIKE) por cada código de la lista**, igual que el
buscador de un único código.

- Backend: nuevo parámetro `?codigos=1045-119-4509-2265` (se parsea por `-`)
  en `listar_equipos` (`backend/app/api/equipos.py`), filtro con `OR` de
  `ILIKE` por cada trozo no vacío. El parámetro `codigo` (único, parcial)
  sigue existiendo igual que antes, sin tocar. Test de regresión añadido
  (`test_listar_equipos_busca_por_multiples_codigos_parciales`).
- Frontend: el input de búsqueda de `equipos/page.tsx` detecta
  automáticamente si el texto tiene un guion — si lo tiene, `useEquipos`
  manda `codigos` en vez de `codigo` (mismo campo, sin UI aparte). Verificado
  con curl real y en navegador (backend 101 tests, tipos/lint limpios).

## 16. Checklist de tareas sobre varios vehículos + lista del día — ✅ hecho

Pedido por el usuario (2026-09-08, cuarta vuelta), dependía del punto 15.
**Decisiones del usuario:** (a) lista **personal, solo en el navegador**
(localStorage, sin tabla nueva en el backend, no compartida entre
técnicos/supervisores); (b) marcar una tarea en la lista del día **no** crea
el `Registro` real — es solo un plan/recordatorio aparte, el registro real se
sigue haciendo desde la ficha del equipo como siempre.

- `frontend/src/lib/planDiario.ts`: helpers puros sobre `localStorage`,
  clave `lote:plan-diario:YYYY-MM-DD` (un día = una clave, no hace falta
  limpieza manual de días viejos). `PlanDiarioContext.tsx` comparte el mismo
  estado entre el badge del menú, la página de la lista y el modal de
  planificación (sin esto cada componente tendría su propia copia
  desincronizada).
- Nuevo item de menú **"Lista del día"** (`layout.tsx`), con badge del número
  de tareas pendientes (no hechas). Página `frontend/src/app/(dashboard)/lista-dia/page.tsx`:
  agrupado por equipo, checkbox para marcar hecho (tachado, solo local),
  botón quitar por tarea y "Quitar hechas". Aviso explícito en la página de
  que marcar aquí no crea el registro real.
- Dos formas de añadir tareas a la lista, ambas sin llamar a `POST /registros`:
  1. Botón **"+ Lista del día"** en cada `TareaChecklistItem.tsx` de la ficha
     del equipo (una tarea, un equipo).
  2. Selección múltiple en `/equipos` (vista Tabla): checkboxes por fila
     (`EquipoTable.tsx`, prop opcional `onToggleSeleccion` — no rompe otros
     usos del componente) + botón "Planificar tareas" que abre
     `PlanificarTareasModal.tsx`: pide el estado de cada equipo seleccionado
     (`GET /estado/equipo/{id}`) y preselecciona las tareas vencidas/próximas
     a vencer, dejando marcar/desmarcar el resto antes de añadir todas de
     golpe.
- Verificado con navegador real: selección de 3 equipos → modal →
  preselección correcta (0 preseleccionadas porque esos equipos de prueba
  estaban al día) → marcar 3 tareas manualmente → aparecen en "Lista del
  día" agrupadas por equipo, badge "3" en el menú → marcar una como hecha
  (tachado, badge baja a 2, aparece "Quitar hechas") → quitar hechas la
  elimina de `localStorage` → botón individual desde la ficha de otro equipo
  también añade correctamente. Frontend: tipos/lint limpios, 13 tests (uno
  nuevo: `TareaChecklistItem` con el botón "+ Lista del día", envuelto en
  `PlanDiarioProvider` para el test).
- **Detalle de herramienta, no de la app:** los clicks de `computer` con
  coordenadas no marcaban las checkboxes nuevas (mismo desajuste de escala
  ya visto en la sesión anterior con el submit del formulario) — confirmado
  con `element.click()` vía `javascript_tool`, que sí las marca y dispara el
  `onChange` de React correctamente.

### Ampliación del punto 16 (2026-09-08, mismo día): registrar directo desde la lista + quién hizo el último registro

El usuario pidió, tras probar lo anterior: (1) poder rellenar observaciones/
horas/km y completar la tarea **directamente desde la lista del día**, sin
volver a la ficha del vehículo; (2) ver quién hizo el último registro de cada
tarea, tanto en la lista del día como en la ficha del equipo. Esto **cambia
la decisión anterior de 16b** (antes: marcar en la lista no creaba el
`Registro` real) — ahora si crea el registro real, es la forma principal de
completar la tarea desde ahí.

- Backend: `EstadoTarea` (`estado_service.py`) y `EstadoTareaOut`
  (`api/estado.py`) ganan `usuario_ultimo_registro: str | None` — nombre del
  usuario del último `Registro` de cada par equipo+tarea (join con `Usuario`
  por `usuario_id`, batcheado con `IN` sobre todos los usuarios implicados,
  no N+1). Aplica tanto a `estado_equipo` como a `estado_lote`. Test de
  regresión: `test_estado_equipo_expone_usuario_del_ultimo_registro`.
- Frontend: nuevo hook `useRegistrarTarea(equipoId, tipoTareaId, onRegistrado)`
  (`hooks/useRegistrarTarea.ts`) — extrae la lógica de formulario/POST
  `/registros` que antes vivía solo en `TareaChecklistItem.tsx`, reutilizada
  ahora también en `PlanDiarioItemRow.tsx` (lista del día). `TareaChecklistItem`
  ahora también muestra "Último: fecha — usuario".
- `PlanDiarioItemRow.tsx` (nuevo): cada tarea pendiente de la lista del día
  tiene su propio formulario Observaciones/Horas/Km + "Marcar realizado", que
  llama a `POST /registros` de verdad (igual que desde la ficha del equipo) y
  al terminar marca el item como hecho (tachado) en el plan local. Ya no hay
  un checkbox de "marcar sin registrar" — la única forma de marcar hecho en
  la lista del día es completando el registro real, que es lo que pidió el
  usuario. `lista-dia/page.tsx` pide el estado (`GET /estado/equipo/{id}`) de
  cada equipo presente en el plan para mostrar el badge de estado y el
  "Último: fecha — usuario" de cada tarea, y lo vuelve a pedir tras cada
  registro para que ese dato se actualice sin recargar la página.
- Verificado end-to-end: backend 102 tests + ruff + black limpios, frontend
  tipos/lint/14 tests limpios, y en navegador real — se registró CAJA_C del
  equipo 1003 desde la lista del día (observaciones "cambio de caja", 120h,
  5000km) y se confirmó con `GET /api/registros?equipo_id=506` que el
  `Registro` real quedó guardado con esos datos exactos; el badge de
  pendientes bajó de 4 a 3 y la tarea quedó tachada. La ficha del equipo
  también muestra ya "Último: 2026-09-08 — Administrador".
- **Nota:** queda en la base de datos local de desarrollo un `Registro` de
  prueba real (id 15, tarea CAJA_C sobre el equipo código "1003", id interno
  506) creado al verificar este flujo, y varios items sueltos en el
  `localStorage` del navegador de pruebas — son datos de desarrollo, no de
  producción, no se han tocado ni hace falta limpiarlos salvo que el usuario
  lo pida.

### Segunda ampliación del punto 16 (2026-09-08, mismo día): cambiar el estado del vehículo al registrar una tarea

El usuario pidió: si al escribir la observación de una tarea (ej. CAJA_C:
"tiene un tornillo suelto") detecta que el vehículo necesita revisión o
taller, poder cambiar su estado operativo (ej. a "Averiado", naranja) **en el
mismo formulario**, sin ir aparte a la sección de estado operativo.

- No hizo falta backend nuevo — reutiliza `POST /api/equipos/{id}/estado`
  (ya existía, `require_supervisor`, ya usado por `EstadoOperativoEquipo.tsx`).
- Frontend: `useRegistrarTarea` (hook compartido) gana un cuarto campo
  opcional `estadoNuevo`. Si al enviar "Marcar realizado" se ha elegido un
  estado, tras crear el `Registro` se llama también a
  `POST /equipos/{id}/estado` con `motivo` = las mismas observaciones escritas
  (no hay que escribirlas dos veces). Si el cambio de estado falla pero el
  registro ya se guardó, se avisa con un mensaje distinto ("Tarea registrada,
  pero no se pudo cambiar el estado...") — el registro no se deshace.
- Nuevo `<select>` "Estado del vehículo…" (sin selección por defecto,
  opciones En taller/Averiado/De baja — **"Activo" no está aquí, ver el
  bugfix justo debajo**) junto al botón "Marcar realizado", tanto en
  `TareaChecklistItem.tsx` (ficha del equipo) como en `PlanDiarioItemRow.tsx`
  (lista del día). **Visible solo para supervisor** (`RoleGate
  rol="supervisor"`, mismo criterio que el resto de cambios de estado en la
  app — un técnico no lo ve). En la ficha del equipo, un cambio de estado
  exitoso actualiza también el badge/historial de "Estado operativo" de la
  página al momento (`onEquipoActualizado` → `setEquipo`), sin recargar.
- Verificado end-to-end en navegador real, ambos sitios: desde la ficha del
  equipo (CAJA_C, "tornillo suelto" → Averiado, badge e historial
  actualizados al instante) y desde la lista del día (F_GASOIL, "fuga de
  gasoil" → En taller), confirmado con `GET /api/equipos/{id}` y
  `GET /api/equipos/{id}/cambios-estado` que el estado y el motivo quedaron
  bien guardados. Frontend: tipos/lint limpios, 16 tests (2 nuevos: no
  aparece el selector para un técnico, y un supervisor sí puede cambiar el
  estado al registrar). Backend sin cambios (102 tests, ruff, black
  limpios).

### Bug real encontrado por el usuario y corregido (2026-09-08, mismo día): un estado "bueno" sobrescribía uno alterado

El usuario detectó el problema con un caso concreto: ACEITE bien, CAJA_C
bien, ENGRASE mal (motivo "raja en la superficie" → el equipo pasa
correctamente a TALLER), y al registrar GRUPO (bien) justo después, si en su
selector se elegía "Activo" para reflejar que esa tarea estaba bien, se
sobrescribía el TALLER que acababa de poner ENGRASE — el vehículo volvía a
verse "Activo" aunque siguiera con un problema real sin resolver. **Regla
que pidió el usuario y queda implementada:** un estado alterado (taller/
averiado/baja) debe prevalecer y no puede volver a "Activo" por registrar
otra tarea — reactivar el vehículo es una decisión explícita, solo desde
"Estado operativo" en la ficha del equipo.

- Fix: `ETIQUETAS_ESTADO_OPERATIVO` en `TareaChecklistItem.tsx` y
  `PlanDiarioItemRow.tsx` ya **no incluye "Activo" como opción** — el
  selector inline de cada tarea solo permite marcar taller/averiado/baja (o
  dejarlo en blanco = sin cambios). El panel dedicado
  `EstadoOperativoEquipo.tsx` (ficha del equipo) sigue teniendo las 4
  opciones, es el único sitio donde se puede reactivar a propósito.
- Test de regresión: verifica que el `<select>` inline solo ofrece
  `["", "taller", "averiado", "baja"]`, nunca `"activo"`.
- Verificado en navegador real reproduciendo el caso exacto del usuario:
  ENGRASE con "raja en la superficie" → taller; GRUPO justo después sin
  tocar el selector → el equipo se mantuvo en "taller" (confirmado con
  `GET /api/equipos/{id}` y el historial de `cambios-estado`, que no
  registra ningún cambio adicional al marcar GRUPO). Frontend: 17 tests,
  tipos/lint limpios. Backend sin tocar.

## Tanda grande (2026-09-08, mismo día): etiquetas, eliminación de lotes, resumen en el buscador

El usuario pidió tres cosas de una vez. Decisiones tomadas explícitamente
antes de implementar (ver preguntas de esa vuelta): etiquetas como motivo
**adicional** al estado fijo (no lo sustituyen), un vehículo puede tener
**varias etiquetas a la vez**, y los lotes se **eliminan por completo**
(columna `lote` borrada de la base de datos, decisión irreversible confirmada
explícitamente pese a la recomendación de solo ocultarlo).

### 17. Etiquetas con color, vinculadas al estado — ✅ hecho

- Backend: tabla nueva `etiquetas` (nombre único, `estado_operativo` — uno de
  activo/taller/averiado/baja —, `color` — uno de los 8: red/orange/yellow/
  green/blue/purple/pink/gray) y tabla de asignación `equipo_etiquetas`
  (many-to-many equipo↔etiqueta, con quién y cuándo la puso, única por par
  equipo+etiqueta). Migración `d4f8b6a1c9e2`. Endpoints: CRUD del catálogo en
  `/api/etiquetas` (`api/etiquetas.py`, supervisor para crear/editar/borrar,
  cualquiera autenticado para listar) y asignación por equipo en
  `/api/equipos/{id}/etiquetas` (`GET`/`POST`/`DELETE`, supervisor para
  escribir). Borrar una etiqueta del catálogo borra también sus asignaciones.
- Frontend: panel nuevo **"Etiquetas"** en la ficha del equipo
  (`EtiquetasEquipo.tsx`) — badges de color con "x" para quitar (supervisor),
  selector para añadir del catálogo (supervisor), visible para todos.
  Gestión del catálogo en Configuración (`EtiquetasConfig.tsx`): formulario
  con nombre, selector de estado y **8 círculos de color** para elegir uno.
  Colores centralizados en `lib/coloresEtiqueta.ts` (nombres en español,
  clases Tailwind por color, para reusar en cualquier sitio futuro).
- **Decisión de alcance:** las etiquetas NO se muestran en la tabla/cuadrícula
  de `/equipos` (por rendimiento con 559 equipos) ni se integraron en el
  selector "Estado del vehículo" del formulario de marcar tarea — son dos
  flujos independientes por ahora. Si se quiere verlas ahí, es una ampliación
  futura, no está hecha.
- Verificado en navegador real: etiqueta "Neumático pinchado" creada
  (Averiado, Naranja) desde Configuración, asignada al equipo 1003 desde su
  ficha (aparece como badge naranja), quitada con la "x" (vuelve a "Sin
  etiquetas."). Backend: 14 tests nuevos en `test_etiquetas_api.py`
  (catálogo, asignación, multi-etiqueta, 403/409/422). Total backend 111
  tests, frontend tipos/lint/17 tests, todo limpio.

### 18. Eliminación completa de los lotes — ✅ hecho

Se quitó el concepto de "lote" de toda la aplicación — un único ámbito con
todos los vehículos juntos, tal como pidió el usuario.

- Backend: columna `Equipo.lote` **borrada** (migración `c2a91f4d7b3e`,
  irreversible, aplicada en local). `estado_lote(db, lote, hoy)` renombrada a
  `estado_equipos(db, hoy)` (ya no filtra por lote, calcula para todos los
  activos no de baja). `dashboard_service`: `ResumenLote`/`resumen_lote`
  eliminados, `DashboardResumen` pasa de una lista `por_lote` a un único
  resumen agregado plano (`total_equipos`, `total_pares`, `total_vencidos`,
  `total_proximos_a_vencer`, `total_sin_registro`, `porcentaje_cumplimiento`).
  Endpoint `GET /api/estado/lote/{lote}` eliminado (no lo usaba el frontend).
  `GET /api/equipos` y `GET /api/exportaciones/estado.xlsx` pierden el
  parámetro `lote`. `seed_equipos.py` ya no extrae lote del nombre de
  archivo (`extract_lote_from_filename` eliminada) — sigue leyendo los
  mismos 21 Excel "engrase N" (por eso existen, no ha cambiado dónde vive el
  dato), pero solo para sacar la lista de códigos, ya no agrupa por lote.
- Frontend: `LoteFilterBar.tsx` eliminado. Sin columna "Lote" en
  `EquipoTable.tsx`, sin filtro en `/equipos`, sin campo en el alta/edición
  de equipo, sin agrupación por lote en `EquipoEstadoGrid.tsx` (mosaico
  único, ya no por secciones), sin "Lote X" en la cabecera de la ficha del
  equipo ni en el PDF/WhatsApp/email compartido. Dashboard (`page.tsx`)
  cambia de una tabla "Cumplimiento por lote" a 4 tarjetas de métricas
  agregadas (equipos activos, vencidas, próximas, % cumplimiento).
  `/reportes` pierde el filtro de lote sobre el Excel de estado.
- **Migraciones de datos:** ninguna necesaria, es una pérdida de columna
  aceptada explícitamente por el usuario — no se guardó backup del valor de
  lote de los 558 equipos históricos.
- Verificado con navegador real en todos los puntos de la lista de arriba
  (equipos, ficha de equipo, dashboard, alta de equipo, reportes, vista
  Estados). Backend: reescritos `test_dashboard_service.py` (de
  `resumen_lote` a `resumen_dashboard` agregado), `test_estado_service.py`
  (rename), `test_export_service.py`/`test_seed_equipos.py` (sin lote),
  eliminado `test_listar_equipos_filtra_por_lote`. Mecánico en el resto de
  fixtures (`Equipo(codigo=..., lote=1)` → `Equipo(codigo=...)`) en 8
  archivos de test más.

### 19. Resumen de actividad + añadir a lista del día en el buscador — ✅ hecho

- `EquipoTable.tsx` gana una prop `mostrarActividad` — cuando hay una
  búsqueda activa (`codigo` no vacío en `/equipos`), la tabla pide en
  paralelo `GET /estado/equipo/{id}` de cada fila visible (seguro en
  rendimiento porque un resultado de búsqueda es siempre un puñado de filas,
  nunca los 559 equipos) y añade dos columnas: **"Última actividad"**
  (tarea + fecha del registro más reciente de ese equipo, o "Sin registros")
  y un botón **"+ Lista del día"** por fila que abre
  `PlanificarTareasModal` para ese único equipo (reutilizado tal cual, ya
  aceptaba una lista de equipos — aquí se le pasa uno solo).
  Sin búsqueda activa, la tabla se ve exactamente igual que antes (sin esas
  columnas, sin llamadas extra).
- Verificado en navegador real: búsqueda "1003" → aparece
  "CAJA_C — 2026-09-08" en Última actividad y el botón funciona (abre el
  modal de planificación con las tareas del equipo).

### Ampliación del buscador multi-código (2026-09-08, mismo día): también acepta comas

El usuario pegó una lista larga de códigos separada por comas (formato
típico al copiar de una hoja de cálculo: `1003, 1006, 1122, ...`) y pidió
que el buscador la entendiera igual que ya entendía el formato con guion.

- Backend: `listar_equipos` (`api/equipos.py`) parsea `codigos` con
  `re.split(r"[,-]+", codigos)` en vez de `codigos.split("-")` — acepta
  guion, coma, o mezcla de ambos como separador, con espacios alrededor
  (se hace `strip()` de cada trozo). Test de regresión:
  `test_listar_equipos_busca_por_codigos_separados_por_coma`.
- Frontend: `useEquipos.ts` cambia la detección de "¿es búsqueda múltiple?"
  de `codigo.includes("-")` a `codigo.includes("-") || codigo.includes(",")`.
  Placeholder del buscador actualizado para mostrar ambos formatos de
  ejemplo.
- Verificado con la lista real de 116 códigos que pegó el usuario: coincide
  con los equipos existentes (113 encontrados — algunos de la lista no
  existen en esta base de datos local, comportamiento correcto de ILIKE
  parcial). Backend 112 tests, ruff y black limpios. Frontend tipos/lint/17
  tests limpios.

### Corrección del resumen en el buscador (2026-09-08, mismo día)

El usuario aclaró que el punto 19 no era lo que pedía: no quería "última
actividad" (una sola línea con la tarea más reciente) sino el **desglose de
las 8 tareas** de cada equipo con su fecha, y un botón "+" junto a **cada
una** (no un botón único que abre un modal). `EquipoTable.tsx` rediseñado:
en modo búsqueda, la columna "Actividades" lista las 8 `EstadoTarea` de cada
fila (punto de color según su estado, nombre, fecha o "Sin registro") con un
botón "+" individual que llama a `agregarItems` del `PlanDiarioContext`
directamente (mismo mecanismo que el botón "+ Lista del día" de la ficha del
equipo) — sin modal. Se quitó `PlanificarTareasModal` de esta vista (seguía
usándose para la selección múltiple de la tabla, eso no cambia). Verificado
en navegador: búsqueda "1005" muestra las 8 tareas con fecha, y el botón "+"
de ACEITE la añade correctamente a la lista del día.

### Bug real de condición de carrera en el buscador (2026-09-08, mismo día)

El usuario detectó que al escribir en el buscador de `/equipos`, a veces se
quedaba mostrando resultados de una búsqueda anterior más amplia (ej.
escribir "1150" mostraba 25 equipos tipo 1115-1119, resultado de una
búsqueda parcial anterior tipo "115"). Causa real: `useEquipos.ts` no
garantizaba que solo se aplicara la respuesta de la ÚLTIMA petición
disparada — si dos peticiones estaban en vuelo a la vez (normal al escribir
rápido) y la más antigua (con un texto más corto, resultado más amplio)
resolvía después que la correcta, sobrescribía el resultado bueno. Como
`EquipoTable` pide las tareas (`/estado/equipo/{id}`) de cada equipo que
recibe, esto también hacía parecer que "buscaba entre todas las tareas de
todos los vehículos" — en realidad estaba pidiendo las tareas del conjunto
de equipos equivocado que había quedado en pantalla.

**Fix:** `useEquipos.ts` lleva ahora un contador de petición (`useRef`) — al
resolver una respuesta, si ya no es la última petición disparada, se
descarta sin aplicar `setEquipos`. Verificado en navegador: buscar "1151"
devuelve exactamente 1 equipo (antes se quedaba a veces con listas más
amplias de búsquedas previas). Frontend: tipos/lint limpios, 17 tests.

### Etiquetas en el resultado del buscador (2026-09-08, mismo día)

Pedido: junto al badge de "Estado" de cada fila del resultado de búsqueda,
mostrar también las etiquetas del vehículo. `EquipoTable.tsx` pide ahora
también `GET /equipos/{id}/etiquetas` de cada equipo (mismo momento y misma
guarda anti-carrera que la petición de tareas, solo en modo búsqueda) y
pinta cada etiqueta con su color (`ESTILOS_COLOR` de `lib/coloresEtiqueta.ts`)
junto al badge de Activo/Archivado y taller/averiado/baja. Verificado con el
equipo 1912 (Averiado, con "Batería agotada" y "Neumático pinchado"
asignadas) — aparecen correctamente en la fila del resultado. Tipos/lint
limpios, 17 tests.

## 13. Propuestas de mejora (no pedidas explícitamente, para valorar)

- **Tabla de auditoría genérica**, en vez de seguir añadiendo `creado_por_id`
  campo a campo por entidad si en el futuro se quiere trazabilidad de más
  acciones (ediciones, archivado, etc.) además de la creación.
- **Email para el aviso de mantenimiento** (punto 5) cuando se decida conectar
  SMTP — el banner por sí solo depende de que alguien abra el dashboard.
- El test `test_decode_access_token_manipulado_lanza_error`
  (`backend/app/tests/test_auth.py`) es intermitente (falla ~1 de cada 3-4
  ejecuciones de la suite completa, pasa siempre en aislamiento) — no se ha
  investigado la causa, no bloquea nada pero conviene revisarlo en algún
  momento.

---

## Estado de ejecución

Puntos 1-4 completados y verificados (tests backend/frontend + navegador
real). Punto 5 con el banner en producción local; el email queda para cuando
el usuario decida retomar SMTP. Migraciones aplicadas en local: `9f0decf73391`
(observaciones + creado_por en equipos) y `fd082b2dc3ee` (periodicidad de
mantenimiento a 180 días).

**Tanda 1 completada (2026-09-08):** puntos 9 (Configuración + CRUD de
tareas), 11 (aviso de engrase) y 12 (elementos/repuestos) implementados,
verificados con tests (backend 77 pasan, frontend tipos/lint/11 tests limpios)
y en navegador real con los tres roles. Migración nueva aplicada en local:
`efba549f42b9` (tabla `elementos`).

**Tanda 2 completada (2026-09-08):** puntos 7 (estado activo/taller/baja +
registro de cambios) y 8 (horas/km por tarea) implementados y verificados
(backend 86 tests, frontend tipos/lint/12 tests, navegador con los tres
roles). Migraciones nuevas: `aabdc6e0553b` (estado operativo + tabla
`cambios_estado_equipo`), `3d8d1b1ec609` (horas/kilómetros en registros). El
punto 9c (límite de horas configurable) sigue aparte — no se ha implementado
porque no hay de dónde sacar la lectura *actual* del vehículo, ver el punto 8.

**Tanda 3 completada (2026-09-08):** punto 9c (límite de horas por tarea)
implementado y verificado end-to-end con curl (backend 99 tests, lint/formato
limpios). Migraciones nuevas: `bfdfcba3e0c3` (lectura actual de horas/km en
equipos), `06fc9d98e49a` (límite de horas en tipos de tarea).

**Cuarta vuelta (2026-09-08):** estado "averiado" (naranja) añadido al
punto 7 — sin migración, verificado con curl. Además se registraron tres
puntos nuevos, **sin empezar a implementar** (sesión cortada por límite de
contexto, continuar en sesión nueva): 14 (vista de estados en columnas),
15 (buscador multi-código tipo `1045-119-4509-2265`) y 16 (checklist de
tareas sobre varios vehículos + lista del día, con preguntas de diseño
abiertas — leer el punto 16 antes de empezar).

**Quinta vuelta (2026-09-08, sesión nueva tras el corte por contexto):**
puntos 14 (vista de estados en columnas), 15 (buscador multi-código) y 16
(checklist multi-vehículo + lista del día) implementados y verificados
(backend 101 tests, frontend tipos/lint/13 tests, navegador real con los
tres flujos de la lista del día). Decisiones del usuario tomadas antes de
implementar: 15 con coincidencia parcial (ILIKE); 16 con lista personal en
el navegador (sin tabla nueva) y sin crear el `Registro` real al marcar.
Detalle completo en las secciones 14-16 de arriba.

**Con esto, todo lo pedido hasta ahora está hecho salvo:** el email del
aviso de mantenimiento (punto 5, aparcado a petición explícita del usuario —
"de momento no, solo dejarlo preparado" para SMTP).

Bugs corregidos el mismo día:
- El proxy de Next devolvía 500 en cualquier respuesta 204 del backend
  (afectaba a "Archivar equipo", y a cualquier futuro DELETE que responda
  204) — ver sección "Bug corregido" arriba.
- `ultimos_registros_por_par` no desempataba por `id` entre registros de la
  misma tarea con la misma fecha, así que el "último registro" podía no ser
  el más reciente realmente — encontrado al verificar el vencimiento por
  horas del punto 9c, corregido con test de regresión (ver punto 8).

Nota de entorno para próximas sesiones: al crear una carpeta de ruta nueva
bajo `frontend/src/app/(dashboard)/` (ej. `configuracion/`), el servidor de
desarrollo de Next puede devolver 404 hasta reiniciar el contenedor
(`docker compose restart frontend`) — no pasa al editar páginas ya
existentes, solo con directorios de ruta completamente nuevos.
