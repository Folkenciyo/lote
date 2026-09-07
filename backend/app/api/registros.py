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


@router.post("", response_model=RegistroOut, status_code=status.HTTP_201_CREATED)
def crear_registro(
    payload: RegistroCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> Registro:
    if db.get(Equipo, payload.equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    if db.get(TipoTarea, payload.tipo_tarea_id) is None:
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
    return registro


@router.get("", response_model=list[RegistroOut])
def listar_registros(
    equipo_id: int | None = None,
    tipo_tarea_id: int | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> list[Registro]:
    query = db.query(Registro)
    if equipo_id is not None:
        query = query.filter(Registro.equipo_id == equipo_id)
    if tipo_tarea_id is not None:
        query = query.filter(Registro.tipo_tarea_id == tipo_tarea_id)
    if desde is not None:
        query = query.filter(Registro.fecha_realizada >= desde)
    if hasta is not None:
        query = query.filter(Registro.fecha_realizada <= hasta)
    return query.order_by(Registro.fecha_realizada.desc()).all()


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
