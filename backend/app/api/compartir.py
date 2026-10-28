from datetime import datetime

import jwt
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.equipos import etiquetas_por_equipo
from app.api.estado import EstadoTareaOut, serializar_estados
from app.api.exportaciones import respuesta_pdf_equipo
from app.api.registros import a_registro_out
from app.core.database import get_db
from app.core.dependencies import require_autenticado
from app.core.security import create_share_token, decode_share_token
from app.models.equipo import Equipo
from app.models.etiqueta import EquipoEtiquetaOut
from app.models.registro import RegistroOut
from app.services.estado_service import estado_equipo
from app.services.pdf_service import cargar_historial_con_usuario

router = APIRouter(prefix="/api", tags=["compartir"])


class EnlaceCompartidoOut(BaseModel):
    token: str
    expira: datetime


class EquipoPublicoOut(BaseModel):
    codigo: str
    marca: str | None
    modelo: str | None
    tipo: str | None
    estado_operativo: str
    lectura_actual_horas: int | None
    lectura_actual_km: int | None
    estados: list[EstadoTareaOut]
    etiquetas: list[EquipoEtiquetaOut]
    historial: list[RegistroOut]
    expira: datetime


def _equipo_de_enlace(token: str, db: Session) -> tuple[Equipo, datetime]:
    try:
        equipo_id, expira = decode_share_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_410_GONE, detail="El enlace ha caducado"
        ) from exc
    except (jwt.InvalidTokenError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Enlace no válido"
        ) from exc
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Enlace no válido"
        )
    return equipo, expira


@router.post(
    "/compartir/equipo/{equipo_id}",
    response_model=EnlaceCompartidoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_autenticado)],
)
def crear_enlace_equipo(
    equipo_id: int, db: Session = Depends(get_db)
) -> EnlaceCompartidoOut:
    if db.get(Equipo, equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    token, expira = create_share_token(equipo_id)
    return EnlaceCompartidoOut(token=token, expira=expira)


@router.get("/publico/equipo/{token}", response_model=EquipoPublicoOut)
def ver_equipo_publico(token: str, db: Session = Depends(get_db)) -> EquipoPublicoOut:
    """Sin sesión: quien tenga el enlace ve la ficha completa hasta que caduca."""
    equipo, expira = _equipo_de_enlace(token, db)
    historial = cargar_historial_con_usuario(db, equipo.id)
    return EquipoPublicoOut(
        codigo=equipo.codigo,
        marca=equipo.marca,
        modelo=equipo.modelo,
        tipo=equipo.tipo,
        estado_operativo=equipo.estado_operativo,
        lectura_actual_horas=equipo.lectura_actual_horas,
        lectura_actual_km=equipo.lectura_actual_km,
        estados=serializar_estados(estado_equipo(db, equipo.id)),
        etiquetas=etiquetas_por_equipo(db, [equipo.id])[equipo.id],
        historial=[
            a_registro_out(registro, usuario, tarea, equipo.codigo)
            for registro, usuario, tarea in historial
        ],
        expira=expira,
    )


@router.get("/publico/equipo/{token}/pdf")
def pdf_equipo_publico(token: str, db: Session = Depends(get_db)) -> Response:
    equipo, _ = _equipo_de_enlace(token, db)
    return respuesta_pdf_equipo(db, equipo)
