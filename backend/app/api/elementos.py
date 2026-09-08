from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado, require_supervisor
from app.models.elemento import Elemento, ElementoCreate, ElementoOut, ElementoUpdate
from app.models.equipo import Equipo

router = APIRouter(tags=["elementos"], dependencies=[Depends(require_autenticado)])


@router.get("/api/equipos/{equipo_id}/elementos", response_model=list[ElementoOut])
def listar_elementos(equipo_id: int, db: Session = Depends(get_db)) -> list[Elemento]:
    if db.get(Equipo, equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    return (
        db.query(Elemento)
        .filter(Elemento.equipo_id == equipo_id)
        .order_by(Elemento.nombre)
        .all()
    )


@router.post(
    "/api/equipos/{equipo_id}/elementos",
    response_model=ElementoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_supervisor)],
)
def crear_elemento(
    equipo_id: int, payload: ElementoCreate, db: Session = Depends(get_db)
) -> Elemento:
    if db.get(Equipo, equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    ya_existe = (
        db.query(Elemento)
        .filter(
            Elemento.equipo_id == equipo_id, Elemento.referencia == payload.referencia
        )
        .first()
    )
    if ya_existe:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un elemento con referencia {payload.referencia}",
        )
    elemento = Elemento(equipo_id=equipo_id, **payload.model_dump())
    db.add(elemento)
    db.commit()
    db.refresh(elemento)
    return elemento


@router.patch(
    "/api/elementos/{elemento_id}",
    response_model=ElementoOut,
    dependencies=[Depends(require_supervisor)],
)
def actualizar_elemento(
    elemento_id: int, payload: ElementoUpdate, db: Session = Depends(get_db)
) -> Elemento:
    elemento = db.get(Elemento, elemento_id)
    if elemento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Elemento no encontrado"
        )
    datos = payload.model_dump(exclude_unset=True)
    if "referencia" in datos and datos["referencia"] != elemento.referencia:
        ya_existe = (
            db.query(Elemento)
            .filter(
                Elemento.equipo_id == elemento.equipo_id,
                Elemento.referencia == datos["referencia"],
            )
            .first()
        )
        if ya_existe:
            referencia = datos["referencia"]
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe un elemento con referencia {referencia}",
            )
    for field, value in datos.items():
        setattr(elemento, field, value)
    db.commit()
    db.refresh(elemento)
    return elemento


@router.delete(
    "/api/elementos/{elemento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_supervisor)],
)
def eliminar_elemento(elemento_id: int, db: Session = Depends(get_db)) -> None:
    elemento = db.get(Elemento, elemento_id)
    if elemento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Elemento no encontrado"
        )
    db.delete(elemento)
    db.commit()
