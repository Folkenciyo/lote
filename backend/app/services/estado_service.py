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
from app.models.usuario import Usuario

ESTADOS = ("sin_registro", "vencido", "proximo_a_vencer", "al_dia")


@dataclass(frozen=True)
class EstadoTarea:
    tipo_tarea_id: int
    tipo_tarea_nombre: str
    periodicidad_dias: int
    fecha_ultimo_registro: date | None
    usuario_ultimo_registro: str | None
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


def combinar_estado_con_horas(
    estado_por_dias: str,
    horas_ultimo_registro: int | None,
    limite_horas: int | None,
    lectura_actual_horas: int | None,
) -> str:
    """Una tarea también puede vencer por horas de uso (ej. cada 250h de
    motor), independientemente de la fecha. Solo se evalúa si la tarea tiene
    un límite configurado y el equipo tiene lectura de horómetro — si falta
    cualquiera de los dos, el estado por días manda tal cual."""
    if estado_por_dias == "vencido":
        return "vencido"
    if (
        limite_horas is None
        or lectura_actual_horas is None
        or horas_ultimo_registro is None
    ):
        return estado_por_dias
    if lectura_actual_horas - horas_ultimo_registro >= limite_horas:
        return "vencido"
    return estado_por_dias


def ultimos_registros_por_par(
    db: Session, equipo_ids: list[int] | None = None
) -> list[Registro]:
    """Último Registro de cada par (equipo_id, tipo_tarea_id) vía ROW_NUMBER."""
    row_number_col = (
        func.row_number()
        .over(
            partition_by=(Registro.equipo_id, Registro.tipo_tarea_id),
            order_by=(Registro.fecha_realizada.desc(), Registro.id.desc()),
        )
        .label("rn")
    )
    subquery = select(Registro, row_number_col).subquery()
    registro_alias = aliased(Registro, subquery)

    query = select(registro_alias).where(subquery.c.rn == 1)
    if equipo_ids is not None:
        query = query.where(registro_alias.equipo_id.in_(equipo_ids))

    return list(db.execute(query).scalars().all())


def _nombres_por_usuario_id(db: Session, registros: list[Registro]) -> dict[int, str]:
    usuario_ids = {registro.usuario_id for registro in registros}
    if not usuario_ids:
        return {}
    filas = (
        db.query(Usuario.id, Usuario.nombre).filter(Usuario.id.in_(usuario_ids)).all()
    )
    return dict(filas)


def estado_equipo(
    db: Session, equipo_id: int, hoy: date | None = None
) -> list[EstadoTarea]:
    hoy = hoy or date.today()
    equipo = db.get(Equipo, equipo_id)
    tareas = db.query(TipoTarea).order_by(TipoTarea.id).all()
    ultimos_registros = ultimos_registros_por_par(db, [equipo_id])
    ultimos = {registro.tipo_tarea_id: registro for registro in ultimos_registros}
    nombres_por_usuario_id = _nombres_por_usuario_id(db, ultimos_registros)
    lectura_actual_horas = equipo.lectura_actual_horas if equipo else None

    resultado = []
    for tarea in tareas:
        ultimo = ultimos.get(tarea.id)
        fecha_ultimo = ultimo.fecha_realizada if ultimo else None
        estado_dias = calcular_estado(fecha_ultimo, tarea.periodicidad_dias, hoy)
        estado = combinar_estado_con_horas(
            estado_dias,
            ultimo.horas_trabajo if ultimo else None,
            tarea.limite_horas,
            lectura_actual_horas,
        )
        resultado.append(
            EstadoTarea(
                tipo_tarea_id=tarea.id,
                tipo_tarea_nombre=tarea.nombre,
                periodicidad_dias=tarea.periodicidad_dias,
                fecha_ultimo_registro=fecha_ultimo,
                usuario_ultimo_registro=(
                    nombres_por_usuario_id.get(ultimo.usuario_id) if ultimo else None
                ),
                estado=estado,
            )
        )
    return resultado


def estado_equipos(
    db: Session, hoy: date | None = None
) -> dict[int, list[EstadoTarea]]:
    hoy = hoy or date.today()
    equipos = (
        db.query(Equipo)
        .filter(
            Equipo.activo.is_(True),
            Equipo.estado_operativo != "baja",
        )
        .all()
    )
    tareas = db.query(TipoTarea).order_by(TipoTarea.id).all()
    equipo_ids = [e.id for e in equipos]

    ultimos_registros = ultimos_registros_por_par(db, equipo_ids)
    ultimos_por_equipo: dict[int, dict[int, Registro]] = {e.id: {} for e in equipos}
    for registro in ultimos_registros:
        ultimos_por_equipo[registro.equipo_id][registro.tipo_tarea_id] = registro
    nombres_por_usuario_id = _nombres_por_usuario_id(db, ultimos_registros)

    resultado: dict[int, list[EstadoTarea]] = {}
    for equipo in equipos:
        ultimos = ultimos_por_equipo[equipo.id]
        equipo_estados = []
        for tarea in tareas:
            ultimo = ultimos.get(tarea.id)
            fecha_ultimo = ultimo.fecha_realizada if ultimo else None
            estado_dias = calcular_estado(fecha_ultimo, tarea.periodicidad_dias, hoy)
            estado = combinar_estado_con_horas(
                estado_dias,
                ultimo.horas_trabajo if ultimo else None,
                tarea.limite_horas,
                equipo.lectura_actual_horas,
            )
            equipo_estados.append(
                EstadoTarea(
                    tipo_tarea_id=tarea.id,
                    tipo_tarea_nombre=tarea.nombre,
                    periodicidad_dias=tarea.periodicidad_dias,
                    fecha_ultimo_registro=fecha_ultimo,
                    usuario_ultimo_registro=(
                        nombres_por_usuario_id.get(ultimo.usuario_id)
                        if ultimo
                        else None
                    ),
                    estado=estado,
                )
            )
        resultado[equipo.id] = equipo_estados
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
