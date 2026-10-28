"""Observaciones (fallos, incidencias) escritas al registrar tareas."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario

FilaObservacion = tuple[Registro, str, str, str]


def ultimas_observaciones_por_equipo(
    db: Session, equipo_ids: list[int], limite: int
) -> dict[int, list[FilaObservacion]]:
    """Las `limite` observaciones no vacías más recientes de cada equipo, como
    filas (registro, usuario_nombre, tipo_tarea_nombre, equipo_codigo)."""
    row_number_col = (
        func.row_number()
        .over(
            partition_by=Registro.equipo_id,
            order_by=(Registro.fecha_realizada.desc(), Registro.id.desc()),
        )
        .label("rn")
    )
    subquery = (
        select(Registro, row_number_col)
        .where(
            Registro.equipo_id.in_(equipo_ids),
            func.trim(Registro.observaciones) != "",
        )
        .subquery()
    )
    registro_alias = aliased(Registro, subquery)
    query = (
        select(registro_alias, Usuario.nombre, TipoTarea.nombre, Equipo.codigo)
        .join(Usuario, registro_alias.usuario_id == Usuario.id)
        .join(TipoTarea, registro_alias.tipo_tarea_id == TipoTarea.id)
        .join(Equipo, registro_alias.equipo_id == Equipo.id)
        .where(subquery.c.rn <= limite)
        .order_by(
            registro_alias.equipo_id,
            registro_alias.fecha_realizada.desc(),
            registro_alias.id.desc(),
        )
    )

    resultado: dict[int, list[FilaObservacion]] = {
        equipo_id: [] for equipo_id in equipo_ids
    }
    for registro, usuario_nombre, tarea_nombre, equipo_codigo in db.execute(query):
        resultado[registro.equipo_id].append(
            (registro, usuario_nombre, tarea_nombre, equipo_codigo)
        )
    return resultado
