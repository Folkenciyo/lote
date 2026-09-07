"""Cálculo del estado de vencimiento de cada tarea de mantenimiento.

El estado se deriva on-the-fly del último `Registro` de cada par
equipo+tarea, sin tablas de estado materializadas.
"""

import calendar
from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.core.config import settings
from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea

ESTADOS = ("sin_registro", "vencido", "proximo_a_vencer", "al_dia")


@dataclass(frozen=True)
class EstadoTarea:
    tipo_tarea_id: int
    tipo_tarea_nombre: str
    periodicidad_dias: int
    fecha_ultimo_registro: date | None
    estado: str


def calcular_estado(
    fecha_ultimo_registro: date | None,
    periodicidad_dias: int,
    hoy: date,
    umbral_proximo_dias: int | None = None,
) -> str:
    if fecha_ultimo_registro is None:
        return "sin_registro"

    umbral = (
        umbral_proximo_dias
        if umbral_proximo_dias is not None
        else settings.proximo_a_vencer_dias
    )
    vencimiento = fecha_ultimo_registro + timedelta(days=periodicidad_dias)
    dias_restantes = (vencimiento - hoy).days

    if dias_restantes <= 0:
        return "vencido"
    if dias_restantes <= umbral:
        return "proximo_a_vencer"
    return "al_dia"


def ultimos_registros_por_par(
    db: Session, equipo_ids: list[int] | None = None
) -> list[Registro]:
    """Último Registro de cada par (equipo_id, tipo_tarea_id) vía ROW_NUMBER."""
    row_number_col = (
        func.row_number()
        .over(
            partition_by=(Registro.equipo_id, Registro.tipo_tarea_id),
            order_by=Registro.fecha_realizada.desc(),
        )
        .label("rn")
    )
    subquery = select(Registro, row_number_col).subquery()
    registro_alias = aliased(Registro, subquery)

    query = select(registro_alias).where(subquery.c.rn == 1)
    if equipo_ids is not None:
        query = query.where(registro_alias.equipo_id.in_(equipo_ids))

    return list(db.execute(query).scalars().all())


def estado_equipo(
    db: Session, equipo_id: int, hoy: date | None = None
) -> list[EstadoTarea]:
    hoy = hoy or date.today()
    tareas = db.query(TipoTarea).order_by(TipoTarea.id).all()
    ultimos = {
        registro.tipo_tarea_id: registro.fecha_realizada
        for registro in ultimos_registros_por_par(db, [equipo_id])
    }

    return [
        EstadoTarea(
            tipo_tarea_id=tarea.id,
            tipo_tarea_nombre=tarea.nombre,
            periodicidad_dias=tarea.periodicidad_dias,
            fecha_ultimo_registro=ultimos.get(tarea.id),
            estado=calcular_estado(ultimos.get(tarea.id), tarea.periodicidad_dias, hoy),
        )
        for tarea in tareas
    ]


def estado_lote(
    db: Session, lote: int, hoy: date | None = None
) -> dict[int, list[EstadoTarea]]:
    hoy = hoy or date.today()
    equipos = (
        db.query(Equipo).filter(Equipo.lote == lote, Equipo.activo.is_(True)).all()
    )
    tareas = db.query(TipoTarea).order_by(TipoTarea.id).all()
    equipo_ids = [e.id for e in equipos]

    ultimos_por_equipo: dict[int, dict[int, date]] = {e.id: {} for e in equipos}
    for registro in ultimos_registros_por_par(db, equipo_ids):
        ultimos_por_equipo[registro.equipo_id][
            registro.tipo_tarea_id
        ] = registro.fecha_realizada

    resultado: dict[int, list[EstadoTarea]] = {}
    for equipo in equipos:
        ultimos = ultimos_por_equipo[equipo.id]
        resultado[equipo.id] = [
            EstadoTarea(
                tipo_tarea_id=tarea.id,
                tipo_tarea_nombre=tarea.nombre,
                periodicidad_dias=tarea.periodicidad_dias,
                fecha_ultimo_registro=ultimos.get(tarea.id),
                estado=calcular_estado(
                    ultimos.get(tarea.id), tarea.periodicidad_dias, hoy
                ),
            )
            for tarea in tareas
        ]
    return resultado


def estado_mes(db: Session, anio: int, mes: int) -> dict[int, dict[int, bool]]:
    """Replica la semántica de las plantillas originales: un mes se marca
    como cumplido si existe al menos un `Registro` con fecha dentro de ese
    mes calendario, sin importar cuántos días faltan para el vencimiento."""
    primer_dia = date(anio, mes, 1)
    ultimo_dia = date(anio, mes, calendar.monthrange(anio, mes)[1])

    equipos = db.query(Equipo).filter(Equipo.activo.is_(True)).all()
    tareas = db.query(TipoTarea).order_by(TipoTarea.id).all()

    registros_del_mes = (
        db.query(Registro.equipo_id, Registro.tipo_tarea_id)
        .filter(Registro.fecha_realizada.between(primer_dia, ultimo_dia))
        .distinct()
        .all()
    )
    realizados = {
        (equipo_id, tipo_tarea_id) for equipo_id, tipo_tarea_id in registros_del_mes
    }

    return {
        equipo.id: {tarea.id: (equipo.id, tarea.id) in realizados for tarea in tareas}
        for equipo in equipos
    }
