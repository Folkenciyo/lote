from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado
from app.models.equipo import Equipo
from app.services.estado_service import estado_equipo, estado_lote, estado_mes

router = APIRouter(
    prefix="/api/estado", tags=["estado"], dependencies=[Depends(require_autenticado)]
)


class EstadoTareaOut(BaseModel):
    tipo_tarea_id: int
    tipo_tarea_nombre: str
    periodicidad_dias: int
    fecha_ultimo_registro: str | None
    estado: str


def _serializar(estados) -> list[EstadoTareaOut]:
    return [
        EstadoTareaOut(
            tipo_tarea_id=e.tipo_tarea_id,
            tipo_tarea_nombre=e.tipo_tarea_nombre,
            periodicidad_dias=e.periodicidad_dias,
            fecha_ultimo_registro=(
                e.fecha_ultimo_registro.isoformat() if e.fecha_ultimo_registro else None
            ),
            estado=e.estado,
        )
        for e in estados
    ]


@router.get("/equipo/{equipo_id}", response_model=list[EstadoTareaOut])
def estado_de_equipo(
    equipo_id: int, db: Session = Depends(get_db)
) -> list[EstadoTareaOut]:
    if db.get(Equipo, equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    return _serializar(estado_equipo(db, equipo_id))


@router.get("/lote/{lote}", response_model=dict[int, list[EstadoTareaOut]])
def estado_de_lote(
    lote: int, db: Session = Depends(get_db)
) -> dict[int, list[EstadoTareaOut]]:
    return {
        equipo_id: _serializar(estados)
        for equipo_id, estados in estado_lote(db, lote).items()
    }


@router.get("/mes/{anio_mes}", response_model=dict[int, dict[int, bool]])
def estado_de_mes(
    anio_mes: str, db: Session = Depends(get_db)
) -> dict[int, dict[int, bool]]:
    try:
        anio_str, mes_str = anio_mes.split("-")
        anio, mes = int(anio_str), int(mes_str)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato esperado: yyyy-mm",
        ) from exc
    return estado_mes(db, anio, mes)
