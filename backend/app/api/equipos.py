from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado, require_supervisor
from app.models.equipo import Equipo, EquipoCreate, EquipoOut, EquipoUpdate

router = APIRouter(prefix="/api/equipos", tags=["equipos"])


@router.get(
    "", response_model=list[EquipoOut], dependencies=[Depends(require_autenticado)]
)
def listar_equipos(
    lote: int | None = None, db: Session = Depends(get_db)
) -> list[Equipo]:
    query = db.query(Equipo)
    if lote is not None:
        query = query.filter(Equipo.lote == lote)
    return query.order_by(Equipo.codigo).all()


@router.post(
    "",
    response_model=EquipoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_supervisor)],
)
def crear_equipo(payload: EquipoCreate, db: Session = Depends(get_db)) -> Equipo:
    if db.query(Equipo).filter(Equipo.codigo == payload.codigo).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un equipo con código {payload.codigo}",
        )
    equipo = Equipo(**payload.model_dump())
    db.add(equipo)
    db.commit()
    db.refresh(equipo)
    return equipo


@router.get(
    "/{equipo_id}",
    response_model=EquipoOut,
    dependencies=[Depends(require_autenticado)],
)
def obtener_equipo(equipo_id: int, db: Session = Depends(get_db)) -> Equipo:
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    return equipo


@router.patch(
    "/{equipo_id}",
    response_model=EquipoOut,
    dependencies=[Depends(require_supervisor)],
)
def actualizar_equipo(
    equipo_id: int, payload: EquipoUpdate, db: Session = Depends(get_db)
) -> Equipo:
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(equipo, field, value)
    db.commit()
    db.refresh(equipo)
    return equipo


@router.delete(
    "/{equipo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_supervisor)],
)
def desactivar_equipo(equipo_id: int, db: Session = Depends(get_db)) -> None:
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    equipo.activo = False
    db.commit()
