import io

from openpyxl import Workbook

from app.models.equipo import Equipo
from app.services.estado_service import EstadoTarea


def construir_filas_export(
    equipos: list[Equipo], estados_por_equipo: dict[int, list[EstadoTarea]]
) -> list[dict]:
    filas = []
    for equipo in equipos:
        fila: dict = {"codigo": equipo.codigo}
        for estado_tarea in estados_por_equipo.get(equipo.id, []):
            fila[f"{estado_tarea.tipo_tarea_nombre}_estado"] = estado_tarea.estado
            fila[f"{estado_tarea.tipo_tarea_nombre}_fecha"] = (
                estado_tarea.fecha_ultimo_registro.isoformat()
                if estado_tarea.fecha_ultimo_registro
                else None
            )
        filas.append(fila)
    return filas


def generar_excel_estado(
    equipos: list[Equipo], estados_por_equipo: dict[int, list[EstadoTarea]]
) -> bytes:
    filas = construir_filas_export(equipos, estados_por_equipo)

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Estado"

    if filas:
        headers = list(filas[0].keys())
        sheet.append(headers)
        for fila in filas:
            sheet.append([fila[h] for h in headers])

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
