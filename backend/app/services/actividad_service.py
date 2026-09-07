from dataclasses import dataclass
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.registro import Registro
from app.models.usuario import Usuario


@dataclass(frozen=True)
class ActividadUsuario:
    usuario_id: int
    nombre: str
    total_registros: int
    ultimo_registro: date | None


def actividad_por_usuario(
    db: Session, desde: date | None = None, hasta: date | None = None
) -> list[ActividadUsuario]:
    """Cuenta cuántos registros de mantenimiento hizo cada usuario.

    Solo aparecen usuarios con al menos un registro en el rango dado
    (join interno): responde a "quién registró qué y cuántos", no a un
    listado completo de usuarios.
    """
    query = db.query(
        Usuario.id,
        Usuario.nombre,
        func.count(Registro.id).label("total"),
        func.max(Registro.fecha_realizada).label("ultimo"),
    ).join(Registro, Registro.usuario_id == Usuario.id)

    if desde is not None:
        query = query.filter(Registro.fecha_realizada >= desde)
    if hasta is not None:
        query = query.filter(Registro.fecha_realizada <= hasta)

    filas = (
        query.group_by(Usuario.id, Usuario.nombre)
        .order_by(func.count(Registro.id).desc())
        .all()
    )

    return [
        ActividadUsuario(
            usuario_id=usuario_id,
            nombre=nombre,
            total_registros=total,
            ultimo_registro=ultimo,
        )
        for usuario_id, nombre, total, ultimo in filas
    ]
