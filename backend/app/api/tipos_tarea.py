from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado, require_supervisor
from app.models.tipo_tarea import (
    CATEGORIAS,
    TipoTarea,
    TipoTareaCreate,
    TipoTareaOut,
    TipoTareaUpdate,
)

router = APIRouter(
    prefix="/api/tipos-tarea",
    tags=["tipos-tarea"],
    dependencies=[Depends(require_autenticado)],
)


@router.get("", response_model=list[TipoTareaOut])
def listar_tipos_tarea(db: Session = Depends(get_db)) -> list[TipoTarea]:
    return db.query(TipoTarea).order_by(TipoTarea.nombre).all()


@router.post(
    "",
    response_model=TipoTareaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_supervisor)],
)
def crear_tipo_tarea(
    payload: TipoTareaCreate, db: Session = Depends(get_db)
) -> TipoTarea:
    if payload.categoria not in CATEGORIAS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Categoría inválida, debe ser una de: {CATEGORIAS}",
        )
    if db.query(TipoTarea).filter(TipoTarea.nombre == payload.nombre).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una tarea con nombre {payload.nombre}",
        )
    tarea = TipoTarea(**payload.model_dump())
    db.add(tarea)
    db.commit()
    db.refresh(tarea)
    return tarea


@router.patch(
    "/{tipo_tarea_id}",
    response_model=TipoTareaOut,
    dependencies=[Depends(require_supervisor)],
)
def actualizar_tipo_tarea(
    tipo_tarea_id: int, payload: TipoTareaUpdate, db: Session = Depends(get_db)
) -> TipoTarea:
    tarea = db.get(TipoTarea, tipo_tarea_id)
    if tarea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de tarea no encontrado"
        )
    datos = payload.model_dump(exclude_unset=True)
    if "categoria" in datos and datos["categoria"] not in CATEGORIAS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Categoría inválida, debe ser una de: {CATEGORIAS}",
        )
    for field, value in datos.items():
        setattr(tarea, field, value)
    db.commit()
    db.refresh(tarea)
    return tarea
