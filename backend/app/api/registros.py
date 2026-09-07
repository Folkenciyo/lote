from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_supervisor
from app.models.equipo import Equipo
from app.models.registro import Registro, RegistroCreate, RegistroOut
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/registros", tags=["registros"])


def _a_registro_out(
    registro: Registro, usuario_nombre: str, tipo_tarea_nombre: str
) -> RegistroOut:
    return RegistroOut(
        id=registro.id,
        equipo_id=registro.equipo_id,
        tipo_tarea_id=registro.tipo_tarea_id,
        tipo_tarea_nombre=tipo_tarea_nombre,
        usuario_id=registro.usuario_id,
        usuario_nombre=usuario_nombre,
        fecha_realizada=registro.fecha_realizada,
        observaciones=registro.observaciones,
    )


@router.post("", response_model=RegistroOut, status_code=status.HTTP_201_CREATED)
def crear_registro(
    payload: RegistroCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> RegistroOut:
    if db.get(Equipo, payload.equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    tipo_tarea = db.get(TipoTarea, payload.tipo_tarea_id)
    if tipo_tarea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de tarea no encontrado"
        )

    registro = Registro(
        equipo_id=payload.equipo_id,
        tipo_tarea_id=payload.tipo_tarea_id,
        fecha_realizada=payload.fecha_realizada,
        observaciones=payload.observaciones,
        usuario_id=usuario.id,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return _a_registro_out(registro, usuario.nombre, tipo_tarea.nombre)


@router.get("", response_model=list[RegistroOut])
def listar_registros(
    equipo_id: int | None = None,
    tipo_tarea_id: int | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> list[RegistroOut]:
    query = (
        db.query(Registro, Usuario.nombre, TipoTarea.nombre)
        .join(Usuario, Registro.usuario_id == Usuario.id)
        .join(TipoTarea, Registro.tipo_tarea_id == TipoTarea.id)
    )
    if equipo_id is not None:
        query = query.filter(Registro.equipo_id == equipo_id)
    if tipo_tarea_id is not None:
        query = query.filter(Registro.tipo_tarea_id == tipo_tarea_id)
    if desde is not None:
        query = query.filter(Registro.fecha_realizada >= desde)
    if hasta is not None:
        query = query.filter(Registro.fecha_realizada <= hasta)

    filas = query.order_by(Registro.fecha_realizada.desc(), Registro.id.desc()).all()
    return [
        _a_registro_out(registro, nombre_usuario, nombre_tarea)
        for registro, nombre_usuario, nombre_tarea in filas
    ]


@router.delete(
    "/{registro_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_supervisor)],
)
def eliminar_registro(registro_id: int, db: Session = Depends(get_db)) -> None:
    registro = db.get(Registro, registro_id)
    if registro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado"
        )
    db.delete(registro)
    db.commit()
