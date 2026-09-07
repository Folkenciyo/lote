from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado
from app.models.equipo import Equipo
from app.services.estado_service import estado_equipo
from app.services.export_service import generar_excel_estado

router = APIRouter(
    prefix="/api/exportaciones",
    tags=["exportaciones"],
    dependencies=[Depends(require_autenticado)],
)


@router.get("/estado.xlsx")
def exportar_estado(lote: int | None = None, db: Session = Depends(get_db)) -> Response:
    query = db.query(Equipo).filter(Equipo.activo.is_(True))
    if lote is not None:
        query = query.filter(Equipo.lote == lote)
    equipos = query.order_by(Equipo.codigo).all()

    estados_por_equipo = {equipo.id: estado_equipo(db, equipo.id) for equipo in equipos}
    contenido = generar_excel_estado(equipos, estados_por_equipo)

    return Response(
        content=contenido,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=estado.xlsx"},
    )
