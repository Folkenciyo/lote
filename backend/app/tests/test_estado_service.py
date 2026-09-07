from datetime import date, timedelta

import pytest

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.estado_service import calcular_estado, estado_equipo


def test_calcular_estado_sin_registro():
    assert calcular_estado(None, 30, date(2026, 1, 1)) == "sin_registro"


def test_calcular_estado_al_dia():
    ultimo = date(2026, 1, 1)
    hoy = date(2026, 1, 10)
    assert (
        calcular_estado(ultimo, periodicidad_dias=30, hoy=hoy, umbral_proximo_dias=5)
        == "al_dia"
    )


def test_calcular_estado_vencido_tras_pasar_la_periodicidad():
    ultimo = date(2026, 1, 1)
    hoy = date(2026, 2, 5)
    assert (
        calcular_estado(ultimo, periodicidad_dias=30, hoy=hoy, umbral_proximo_dias=5)
        == "vencido"
    )


@pytest.mark.parametrize(
    "dias_restantes,estado_esperado",
    [
        (6, "al_dia"),
        (5, "proximo_a_vencer"),
        (1, "proximo_a_vencer"),
        (0, "vencido"),
        (-1, "vencido"),
    ],
)
def test_calcular_estado_umbral_limite(dias_restantes, estado_esperado):
    periodicidad = 30
    hoy = date(2026, 1, 31)
    vencimiento = hoy + timedelta(days=dias_restantes)
    ultimo = vencimiento - timedelta(days=periodicidad)

    estado = calcular_estado(ultimo, periodicidad, hoy, umbral_proximo_dias=5)
    assert estado == estado_esperado


def _crear_equipo_y_tarea(db_session):
    equipo = Equipo(codigo="1002", lote=1)
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add_all([equipo, tarea])
    db_session.commit()
    return equipo, tarea


def test_estado_equipo_usa_el_ultimo_registro_no_el_mas_antiguo(db_session):
    equipo, tarea = _crear_equipo_y_tarea(db_session)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    db_session.add(usuario)
    db_session.commit()

    db_session.add_all(
        [
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=usuario.id,
                fecha_realizada=date(2020, 1, 1),
            ),
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=usuario.id,
                fecha_realizada=date.today(),
            ),
        ]
    )
    db_session.commit()

    estados = estado_equipo(db_session, equipo.id, hoy=date.today())
    estado_aceite = next(e for e in estados if e.tipo_tarea_nombre == "ACEITE")
    assert estado_aceite.estado == "al_dia"
    assert estado_aceite.fecha_ultimo_registro == date.today()


def test_estado_equipo_sin_ningun_registro_es_sin_registro(db_session):
    equipo, _ = _crear_equipo_y_tarea(db_session)
    estados = estado_equipo(db_session, equipo.id, hoy=date.today())
    assert all(e.estado == "sin_registro" for e in estados)
