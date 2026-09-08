from datetime import date, timedelta

import pytest

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.estado_service import (
    calcular_estado,
    combinar_estado_con_horas,
    estado_equipo,
    estado_equipos,
    ultimos_registros_por_par,
)


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


def test_combinar_estado_con_horas_sin_limite_configurado_no_cambia_nada():
    assert combinar_estado_con_horas("al_dia", 100, None, 500) == "al_dia"


def test_combinar_estado_con_horas_sin_lectura_actual_no_cambia_nada():
    assert combinar_estado_con_horas("al_dia", 100, 250, None) == "al_dia"


def test_combinar_estado_con_horas_vence_al_superar_el_limite():
    # último servicio a las 100h, límite 250h, lectura actual 360h -> 260h transcurridas
    assert combinar_estado_con_horas("al_dia", 100, 250, 360) == "vencido"


def test_combinar_estado_con_horas_no_vence_por_debajo_del_limite():
    assert combinar_estado_con_horas("al_dia", 100, 250, 300) == "al_dia"


def test_combinar_estado_con_horas_ya_vencido_por_dias_se_mantiene():
    assert combinar_estado_con_horas("vencido", None, 250, None) == "vencido"


def test_ultimos_registros_por_par_desempata_por_id_en_misma_fecha(db_session):
    """Bug real encontrado probando el vencimiento por horas: dos registros de
    la misma tarea en la misma fecha deben desempatar por el más reciente
    creado (id mayor), no por orden arbitrario de la base de datos."""
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    db_session.add_all([equipo, tarea, usuario])
    db_session.commit()

    hoy = date.today()
    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=hoy,
            horas_trabajo=100,
        )
    )
    db_session.commit()
    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=hoy,
            horas_trabajo=999,
        )
    )
    db_session.commit()

    ultimos = ultimos_registros_por_par(db_session, [equipo.id])
    assert len(ultimos) == 1
    assert ultimos[0].horas_trabajo == 999


def _crear_equipo_y_tarea(db_session):
    equipo = Equipo(codigo="1002")
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


def test_estado_equipo_expone_usuario_del_ultimo_registro(db_session):
    equipo, tarea = _crear_equipo_y_tarea(db_session)
    otra_tarea_sin_registro = TipoTarea(
        nombre="GRUPO", categoria="engrase", periodicidad_dias=30
    )
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="Ana", rol="tecnico")
    db_session.add_all([otra_tarea_sin_registro, usuario])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=date.today(),
        )
    )
    db_session.commit()

    estados = estado_equipo(db_session, equipo.id, hoy=date.today())
    estado_aceite = next(e for e in estados if e.tipo_tarea_nombre == "ACEITE")
    assert estado_aceite.usuario_ultimo_registro == "Ana"

    estado_grupo = next(e for e in estados if e.tipo_tarea_nombre == "GRUPO")
    assert estado_grupo.usuario_ultimo_registro is None


def test_estado_equipo_sin_ningun_registro_es_sin_registro(db_session):
    equipo, _ = _crear_equipo_y_tarea(db_session)
    estados = estado_equipo(db_session, equipo.id, hoy=date.today())
    assert all(e.estado == "sin_registro" for e in estados)


def test_estado_equipo_vencido_por_horas_aunque_este_al_dia_por_fecha(db_session):
    equipo = Equipo(codigo="1002", lectura_actual_horas=1500)
    tarea = TipoTarea(
        nombre="ACEITE", categoria="engrase", periodicidad_dias=30, limite_horas=250
    )
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    db_session.add_all([equipo, tarea, usuario])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=date.today(),
            horas_trabajo=1000,
        )
    )
    db_session.commit()

    estados = estado_equipo(db_session, equipo.id, hoy=date.today())
    estado_aceite = next(e for e in estados if e.tipo_tarea_nombre == "ACEITE")
    assert estado_aceite.estado == "vencido"


def test_estado_equipo_sin_lectura_actual_ignora_limite_horas(db_session):
    equipo = Equipo(codigo="1002", lectura_actual_horas=None)
    tarea = TipoTarea(
        nombre="ACEITE", categoria="engrase", periodicidad_dias=30, limite_horas=250
    )
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    db_session.add_all([equipo, tarea, usuario])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=date.today(),
            horas_trabajo=1000,
        )
    )
    db_session.commit()

    estados = estado_equipo(db_session, equipo.id, hoy=date.today())
    estado_aceite = next(e for e in estados if e.tipo_tarea_nombre == "ACEITE")
    assert estado_aceite.estado == "al_dia"


def test_estado_equipos_excluye_equipos_de_baja_pero_incluye_taller_y_averiado(
    db_session,
):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    activo = Equipo(codigo="1001", estado_operativo="activo")
    taller = Equipo(codigo="1002", estado_operativo="taller")
    baja = Equipo(codigo="1003", estado_operativo="baja")
    averiado = Equipo(codigo="1004", estado_operativo="averiado")
    db_session.add_all([tarea, activo, taller, baja, averiado])
    db_session.commit()

    resultado = estado_equipos(db_session, hoy=date.today())

    assert activo.id in resultado
    assert taller.id in resultado
    assert averiado.id in resultado
    assert baja.id not in resultado
