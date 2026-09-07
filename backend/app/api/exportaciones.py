from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado
from app.models.equipo import Equipo
from app.services.estado_service import estado_equipo
from app.services.export_service import generar_excel_estado
from app.services.pdf_service import cargar_historial_con_usuario, generar_pdf_equipo

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


@router.get("/equipo/{equipo_id}.pdf")
def exportar_equipo_pdf(equipo_id: int, db: Session = Depends(get_db)) -> Response:
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )

    estados = estado_equipo(db, equipo_id)
    historial = cargar_historial_con_usuario(db, equipo_id)
    contenido = generar_pdf_equipo(equipo, estados, historial)

    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=equipo-{equipo.codigo}.pdf"
        },
    )
