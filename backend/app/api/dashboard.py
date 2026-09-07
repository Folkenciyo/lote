from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado
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
