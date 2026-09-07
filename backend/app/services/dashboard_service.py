from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.services.estado_service import estado_lote


@dataclass(frozen=True)
class ResumenLote:
    lote: int
    total_equipos: int
    total_pares: int
    vencidos: int
    proximos_a_vencer: int
    sin_registro: int
    porcentaje_cumplimiento: float


@dataclass(frozen=True)
class DashboardResumen:
    total_equipos: int
    total_vencidos: int
    total_proximos_a_vencer: int
    por_lote: list[ResumenLote]


def resumen_lote(db: Session, lote: int, hoy: date | None = None) -> ResumenLote:
    estados_por_equipo = estado_lote(db, lote, hoy)

    total_pares = 0
    vencidos = 0
    proximos = 0
    sin_registro = 0
    cumplidos = 0
    for estados in estados_por_equipo.values():
        for estado_tarea in estados:
            total_pares += 1
            if estado_tarea.estado == "vencido":
                vencidos += 1
            elif estado_tarea.estado == "sin_registro":
                sin_registro += 1
            else:
                cumplidos += 1
                if estado_tarea.estado == "proximo_a_vencer":
                    proximos += 1

    porcentaje = (cumplidos / total_pares * 100) if total_pares else 0.0

    return ResumenLote(
        lote=lote,
        total_equipos=len(estados_por_equipo),
        total_pares=total_pares,
        vencidos=vencidos,
        proximos_a_vencer=proximos,
        sin_registro=sin_registro,
        porcentaje_cumplimiento=round(porcentaje, 2),
    )


def resumen_dashboard(db: Session, hoy: date | None = None) -> DashboardResumen:
    hoy = hoy or date.today()
    lotes = [
        row[0]
        for row in db.query(Equipo.lote)
        .filter(Equipo.activo.is_(True))
        .distinct()
        .order_by(Equipo.lote)
        .all()
    ]

    por_lote = [resumen_lote(db, lote, hoy) for lote in lotes]

    return DashboardResumen(
        total_equipos=sum(r.total_equipos for r in por_lote),
        total_vencidos=sum(r.vencidos for r in por_lote),
        total_proximos_a_vencer=sum(r.proximos_a_vencer for r in por_lote),
        por_lote=por_lote,
    )
