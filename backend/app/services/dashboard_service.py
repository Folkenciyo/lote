from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.services.estado_service import (
    calcular_estado,
    combinar_estado_con_horas,
    estado_equipos,
    ultimos_registros_por_par,
)


@dataclass(frozen=True)
class DashboardResumen:
    total_equipos: int
    total_pares: int
    total_vencidos: int
    total_proximos_a_vencer: int
    total_sin_registro: int
    porcentaje_cumplimiento: float


def resumen_dashboard(db: Session, hoy: date | None = None) -> DashboardResumen:
    estados_por_equipo = estado_equipos(db, hoy)

    total_pares = 0
    vencidos = 0
    proximos = 0
    sin_registro = 0
    cumplidos = 0
    for estados in estados_por_equipo.values():
        for estado_tarea in estados:
            total_pares += 1
            if estado_tarea.estado == "vencido":
                vencidos += 1
            elif estado_tarea.estado == "sin_registro":
                sin_registro += 1
            else:
                cumplidos += 1
                if estado_tarea.estado == "proximo_a_vencer":
                    proximos += 1

    porcentaje = (cumplidos / total_pares * 100) if total_pares else 0.0

    return DashboardResumen(
        total_equipos=len(estados_por_equipo),
        total_pares=total_pares,
        total_vencidos=vencidos,
        total_proximos_a_vencer=proximos,
        total_sin_registro=sin_registro,
        porcentaje_cumplimiento=round(porcentaje, 2),
    )


@dataclass(frozen=True)
class AvisoCategoria:
    categoria: str
    total_vencidos: int
    codigos_equipos: list[str]


def avisos_categoria(
    db: Session, categoria: str, hoy: date | None = None
) -> AvisoCategoria:
    """Vehículos con alguna tarea de la categoría dada vencida — "mantenimiento"
    (revisión cada 6 meses) o "engrase" (mensual). Se calculan por separado
    porque tienen periodicidad y criticidad distintas, a diferencia del total
    general del dashboard que las mezcla todas."""
    hoy = hoy or date.today()
    equipos = (
        db.query(Equipo)
        .filter(Equipo.activo.is_(True), Equipo.estado_operativo != "baja")
        .all()
    )
    tareas = db.query(TipoTarea).filter(TipoTarea.categoria == categoria).all()
    if not equipos or not tareas:
        return AvisoCategoria(categoria=categoria, total_vencidos=0, codigos_equipos=[])

    tareas_por_id = {t.id: t for t in tareas}
    equipo_ids = [e.id for e in equipos]

    ultimos_por_equipo: dict[int, dict[int, Registro]] = {e.id: {} for e in equipos}
    for registro in ultimos_registros_por_par(db, equipo_ids):
        if registro.tipo_tarea_id in tareas_por_id:
            ultimos_por_equipo[registro.equipo_id][registro.tipo_tarea_id] = registro

    codigos_vencidos = []
    for equipo in equipos:
        ultimos = ultimos_por_equipo[equipo.id]
        vencido = False
        for tarea_id, tarea in tareas_por_id.items():
            ultimo = ultimos.get(tarea_id)
            fecha_ultimo = ultimo.fecha_realizada if ultimo else None
            estado_dias = calcular_estado(fecha_ultimo, tarea.periodicidad_dias, hoy)
            estado = combinar_estado_con_horas(
                estado_dias,
                ultimo.horas_trabajo if ultimo else None,
                tarea.limite_horas,
                equipo.lectura_actual_horas,
            )
            if estado == "vencido":
                vencido = True
                break
        if vencido:
            codigos_vencidos.append(equipo.codigo)

    return AvisoCategoria(
        categoria=categoria,
        total_vencidos=len(codigos_vencidos),
        codigos_equipos=sorted(codigos_vencidos),
    )
