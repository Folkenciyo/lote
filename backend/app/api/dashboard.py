from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado
from app.services.actividad_service import actividad_por_usuario
from app.services.dashboard_service import avisos_categoria, resumen_dashboard

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require_autenticado)],
)


class DashboardResumenOut(BaseModel):
    total_equipos: int
    total_pares: int
    total_vencidos: int
    total_proximos_a_vencer: int
    total_sin_registro: int
    porcentaje_cumplimiento: float


@router.get("/resumen", response_model=DashboardResumenOut)
def obtener_resumen(db: Session = Depends(get_db)) -> DashboardResumenOut:
    resumen = resumen_dashboard(db)
    return DashboardResumenOut(**vars(resumen))


class AvisoCategoriaOut(BaseModel):
    total_vencidos: int
    codigos_equipos: list[str]


class AvisosOut(BaseModel):
    mantenimiento: AvisoCategoriaOut
    engrase: AvisoCategoriaOut


@router.get("/avisos-mantenimiento", response_model=AvisosOut)
def obtener_avisos_mantenimiento(db: Session = Depends(get_db)) -> AvisosOut:
    mantenimiento = avisos_categoria(db, "mantenimiento")
    engrase = avisos_categoria(db, "engrase")
    return AvisosOut(
        mantenimiento=AvisoCategoriaOut(
            total_vencidos=mantenimiento.total_vencidos,
            codigos_equipos=mantenimiento.codigos_equipos,
        ),
        engrase=AvisoCategoriaOut(
            total_vencidos=engrase.total_vencidos,
            codigos_equipos=engrase.codigos_equipos,
        ),
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
