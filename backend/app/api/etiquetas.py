from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado, require_supervisor
from app.models.equipo import ESTADOS_OPERATIVOS
from app.models.etiqueta import (
    COLORES_ETIQUETA,
    EquipoEtiqueta,
    Etiqueta,
    EtiquetaCreate,
    EtiquetaOut,
    EtiquetaUpdate,
)

router = APIRouter(
    prefix="/api/etiquetas",
    tags=["etiquetas"],
    dependencies=[Depends(require_autenticado)],
)


def _validar_estado_y_color(estado_operativo: str | None, color: str | None) -> None:
    if estado_operativo is not None and estado_operativo not in ESTADOS_OPERATIVOS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Estado inválido, debe ser uno de: {ESTADOS_OPERATIVOS}",
        )
    if color is not None and color not in COLORES_ETIQUETA:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Color inválido, debe ser uno de: {COLORES_ETIQUETA}",
        )


@router.get("", response_model=list[EtiquetaOut])
def listar_etiquetas(db: Session = Depends(get_db)) -> list[EtiquetaOut]:
    return db.query(Etiqueta).order_by(Etiqueta.nombre).all()


@router.post(
    "",
    response_model=EtiquetaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_supervisor)],
)
def crear_etiqueta(
    payload: EtiquetaCreate, db: Session = Depends(get_db)
) -> EtiquetaOut:
    _validar_estado_y_color(payload.estado_operativo, payload.color)
    if db.query(Etiqueta).filter(Etiqueta.nombre == payload.nombre).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una etiqueta con nombre {payload.nombre}",
        )
    etiqueta = Etiqueta(**payload.model_dump())
    db.add(etiqueta)
    db.commit()
    db.refresh(etiqueta)
    return etiqueta


@router.patch(
    "/{etiqueta_id}",
    response_model=EtiquetaOut,
    dependencies=[Depends(require_supervisor)],
)
def actualizar_etiqueta(
    etiqueta_id: int, payload: EtiquetaUpdate, db: Session = Depends(get_db)
) -> EtiquetaOut:
    etiqueta = db.get(Etiqueta, etiqueta_id)
    if etiqueta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Etiqueta no encontrada"
        )
    _validar_estado_y_color(payload.estado_operativo, payload.color)
    if payload.nombre is not None and payload.nombre != etiqueta.nombre:
        if db.query(Etiqueta).filter(Etiqueta.nombre == payload.nombre).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe una etiqueta con nombre {payload.nombre}",
            )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(etiqueta, field, value)
    db.commit()
    db.refresh(etiqueta)
    return etiqueta


@router.delete(
    "/{etiqueta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_supervisor)],
)
def eliminar_etiqueta(etiqueta_id: int, db: Session = Depends(get_db)) -> None:
    etiqueta = db.get(Etiqueta, etiqueta_id)
    if etiqueta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Etiqueta no encontrada"
        )
    db.query(EquipoEtiqueta).filter(EquipoEtiqueta.etiqueta_id == etiqueta_id).delete()
    db.delete(etiqueta)
    db.commit()
