from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado
from app.models.elemento import Elemento
from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.estado_service import estado_equipo
from app.services.export_service import generar_excel_estado
from app.services.pdf_service import (
    cargar_historial_con_usuario,
    generar_pdf_elementos,
    generar_pdf_equipo,
    generar_pdf_historial,
)

router = APIRouter(
    prefix="/api/exportaciones",
    tags=["exportaciones"],
    dependencies=[Depends(require_autenticado)],
)


@router.get("/estado.xlsx")
def exportar_estado(db: Session = Depends(get_db)) -> Response:
    equipos = (
        db.query(Equipo).filter(Equipo.activo.is_(True)).order_by(Equipo.codigo).all()
    )

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


@router.get("/equipo/{equipo_id}/elementos.pdf")
def exportar_elementos_pdf(equipo_id: int, db: Session = Depends(get_db)) -> Response:
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    elementos = (
        db.query(Elemento)
        .filter(Elemento.equipo_id == equipo_id)
        .order_by(Elemento.nombre)
        .all()
    )
    contenido = generar_pdf_elementos(equipo, elementos)

    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=elementos-{equipo.codigo}.pdf"
        },
    )


@router.get("/historial.pdf")
def exportar_historial_pdf(
    equipo_id: int | None = None,
    tipo_tarea_id: int | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: Session = Depends(get_db),
) -> Response:
    query = (
        db.query(Registro, Usuario.nombre, TipoTarea.nombre, Equipo.codigo)
        .join(Usuario, Registro.usuario_id == Usuario.id)
        .join(TipoTarea, Registro.tipo_tarea_id == TipoTarea.id)
        .join(Equipo, Registro.equipo_id == Equipo.id)
    )
    if equipo_id is not None:
        query = query.filter(Registro.equipo_id == equipo_id)
    if tipo_tarea_id is not None:
        query = query.filter(Registro.tipo_tarea_id == tipo_tarea_id)
    if desde is not None:
        query = query.filter(Registro.fecha_realizada >= desde)
    if hasta is not None:
        query = query.filter(Registro.fecha_realizada <= hasta)

    historial = query.order_by(
        Registro.fecha_realizada.desc(), Registro.id.desc()
    ).all()
    contenido = generar_pdf_historial(historial)

    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=historial.pdf"},
    )
