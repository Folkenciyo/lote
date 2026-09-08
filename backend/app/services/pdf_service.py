from datetime import date

from fpdf import FPDF
from fpdf.enums import XPos, YPos
from sqlalchemy.orm import Session

from app.models.elemento import Elemento
from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.estado_service import EstadoTarea

ESTADO_TEXTO = {
    "al_dia": "Al dia",
    "proximo_a_vencer": "Proximo a vencer",
    "vencido": "Vencido",
    "sin_registro": "Sin registro",
}

_NEXT_LINE = {"new_x": XPos.LMARGIN, "new_y": YPos.NEXT}


def generar_pdf_equipo(
    equipo: Equipo,
    estados: list[EstadoTarea],
    historial: list[tuple[Registro, str, str]],
) -> bytes:
    """historial: (Registro, nombre_usuario, nombre_tarea), más reciente primero."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, f"Equipo {equipo.codigo}", **_NEXT_LINE)

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, f"Marca: {equipo.marca or '-'}", **_NEXT_LINE)
    pdf.cell(0, 7, f"Modelo: {equipo.modelo or '-'}", **_NEXT_LINE)
    pdf.cell(0, 7, f"Tipo: {equipo.tipo or '-'}", **_NEXT_LINE)
    pdf.cell(
        0, 7, f"Estado: {'Activo' if equipo.activo else 'Archivado'}", **_NEXT_LINE
    )
    pdf.cell(0, 7, f"Generado: {date.today().isoformat()}", **_NEXT_LINE)
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Estado actual por tarea", **_NEXT_LINE)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(50, 7, "Tarea", border=1)
    pdf.cell(35, 7, "Estado", border=1)
    pdf.cell(35, 7, "Periodicidad", border=1)
    pdf.cell(40, 7, "Ultimo registro", border=1, **_NEXT_LINE)
    pdf.set_font("Helvetica", "", 10)
    for estado in estados:
        pdf.cell(50, 7, estado.tipo_tarea_nombre, border=1)
        pdf.cell(35, 7, ESTADO_TEXTO.get(estado.estado, estado.estado), border=1)
        pdf.cell(35, 7, f"{estado.periodicidad_dias} dias", border=1)
        pdf.cell(
            40,
            7,
            (
                estado.fecha_ultimo_registro.isoformat()
                if estado.fecha_ultimo_registro
                else "-"
            ),
            border=1,
            **_NEXT_LINE,
        )
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Historial de mantenimiento", **_NEXT_LINE)
    if not historial:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "Sin registros todavia.", **_NEXT_LINE)
    else:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(28, 7, "Fecha", border=1)
        pdf.cell(35, 7, "Tarea", border=1)
        pdf.cell(45, 7, "Registrado por", border=1)
        pdf.cell(72, 7, "Observaciones", border=1, **_NEXT_LINE)
        pdf.set_font("Helvetica", "", 9)
        for registro, nombre_usuario, nombre_tarea in historial:
            pdf.cell(28, 7, registro.fecha_realizada.isoformat(), border=1)
            pdf.cell(35, 7, nombre_tarea, border=1)
            pdf.cell(45, 7, nombre_usuario, border=1)
            pdf.cell(72, 7, registro.observaciones or "-", border=1, **_NEXT_LINE)

    return bytes(pdf.output())


def cargar_historial_con_usuario(
    db: Session, equipo_id: int
) -> list[tuple[Registro, str, str]]:
    filas = (
        db.query(Registro, Usuario.nombre, TipoTarea.nombre)
        .join(Usuario, Registro.usuario_id == Usuario.id)
        .join(TipoTarea, Registro.tipo_tarea_id == TipoTarea.id)
        .filter(Registro.equipo_id == equipo_id)
        .order_by(Registro.fecha_realizada.desc(), Registro.id.desc())
        .all()
    )
    return list(filas)


def generar_pdf_historial(
    historial: list[tuple[Registro, str, str, str]],
) -> bytes:
    """historial: (Registro, nombre_usuario, nombre_tarea, codigo_equipo), más
    reciente primero. A diferencia de generar_pdf_equipo, cubre varios equipos
    a la vez — es el histórico filtrado del reporte, no la ficha de un equipo."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Historico de mantenimiento", **_NEXT_LINE)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, f"Generado: {date.today().isoformat()}", **_NEXT_LINE)
    pdf.cell(0, 7, f"Registros: {len(historial)}", **_NEXT_LINE)
    pdf.ln(4)

    if not historial:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "Sin registros para los filtros seleccionados.", **_NEXT_LINE)
        return bytes(pdf.output())

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(24, 7, "Fecha", border=1)
    pdf.cell(22, 7, "Equipo", border=1)
    pdf.cell(32, 7, "Tarea", border=1)
    pdf.cell(40, 7, "Registrado por", border=1)
    pdf.cell(72, 7, "Observaciones", border=1, **_NEXT_LINE)
    pdf.set_font("Helvetica", "", 9)
    for registro, nombre_usuario, nombre_tarea, codigo_equipo in historial:
        pdf.cell(24, 7, registro.fecha_realizada.isoformat(), border=1)
        pdf.cell(22, 7, codigo_equipo, border=1)
        pdf.cell(32, 7, nombre_tarea, border=1)
        pdf.cell(40, 7, nombre_usuario, border=1)
        pdf.cell(72, 7, registro.observaciones or "-", border=1, **_NEXT_LINE)

    return bytes(pdf.output())


def generar_pdf_elementos(equipo: Equipo, elementos: list[Elemento]) -> bytes:
    """Lista de elementos/repuestos de un equipo, pensada para llevar al
    proveedor a la hora de pedir repuestos: elemento + referencia."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, f"Elementos del equipo {equipo.codigo}", **_NEXT_LINE)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, f"Generado: {date.today().isoformat()}", **_NEXT_LINE)
    pdf.ln(4)

    if not elementos:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "Este equipo no tiene elementos registrados.", **_NEXT_LINE)
        return bytes(pdf.output())

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(60, 7, "Elemento", border=1)
    pdf.cell(45, 7, "Referencia", border=1)
    pdf.cell(85, 7, "Observaciones", border=1, **_NEXT_LINE)
    pdf.set_font("Helvetica", "", 9)
    for elemento in elementos:
        pdf.cell(60, 7, elemento.nombre, border=1)
        pdf.cell(45, 7, elemento.referencia, border=1)
        pdf.cell(85, 7, elemento.observaciones or "-", border=1, **_NEXT_LINE)

    return bytes(pdf.output())
