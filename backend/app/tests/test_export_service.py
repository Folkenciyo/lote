from datetime import date

from app.models.equipo import Equipo
from app.services.estado_service import EstadoTarea
from app.services.export_service import construir_filas_export


def test_construir_filas_export_transforma_estados_en_filas_planas():
    equipo = Equipo(id=1, codigo="1002", lote=1)
    estados_por_equipo = {
        1: [
            EstadoTarea(
                tipo_tarea_id=1,
                tipo_tarea_nombre="ACEITE",
                periodicidad_dias=30,
                fecha_ultimo_registro=date(2026, 1, 1),
                estado="al_dia",
            ),
            EstadoTarea(
                tipo_tarea_id=2,
                tipo_tarea_nombre="GRUPO",
                periodicidad_dias=30,
                fecha_ultimo_registro=None,
                estado="sin_registro",
            ),
        ]
    }

    filas = construir_filas_export([equipo], estados_por_equipo)

    assert filas == [
        {
            "codigo": "1002",
            "lote": 1,
            "ACEITE_estado": "al_dia",
            "ACEITE_fecha": "2026-01-01",
            "GRUPO_estado": "sin_registro",
            "GRUPO_fecha": None,
        }
    ]


def test_construir_filas_export_equipo_sin_estados_da_solo_codigo_y_lote():
    equipo = Equipo(id=1, codigo="1002", lote=1)
    filas = construir_filas_export([equipo], {})
    assert filas == [{"codigo": "1002", "lote": 1}]
