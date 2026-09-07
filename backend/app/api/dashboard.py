from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado
from app.services.actividad_service import actividad_por_usuario
from app.services.dashboard_service import resumen_dashboard

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require_autenticado)],
)


class ResumenLoteOut(BaseModel):
    lote: int
    total_equipos: int
    total_pares: int
    vencidos: int
    proximos_a_vencer: int
    sin_registro: int
    porcentaje_cumplimiento: float


class DashboardResumenOut(BaseModel):
    total_equipos: int
    total_vencidos: int
    total_proximos_a_vencer: int
    por_lote: list[ResumenLoteOut]


@router.get("/resumen", response_model=DashboardResumenOut)
def obtener_resumen(db: Session = Depends(get_db)) -> DashboardResumenOut:
    resumen = resumen_dashboard(db)
    return DashboardResumenOut(
        total_equipos=resumen.total_equipos,
        total_vencidos=resumen.total_vencidos,
        total_proximos_a_vencer=resumen.total_proximos_a_vencer,
        por_lote=[ResumenLoteOut(**vars(r)) for r in resumen.por_lote],
    )


class ActividadUsuarioOut(BaseModel):
    usuario_id: int
    nombre: str
    total_registros: int
    ultimo_registro: str | None


@router.get("/actividad", response_model=list[ActividadUsuarioOut])
def obtener_actividad(
    desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)
) -> list[ActividadUsuarioOut]:
    actividad = actividad_por_usuario(db, desde, hasta)
    return [
        ActividadUsuarioOut(
            usuario_id=a.usuario_id,
            nombre=a.nombre,
            total_registros=a.total_registros,
            ultimo_registro=(
                a.ultimo_registro.isoformat() if a.ultimo_registro else None
            ),
        )
        for a in actividad
    ]
