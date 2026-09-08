from datetime import date

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.estado_service import estado_mes


def test_estado_mes_marca_cumplido_solo_si_hay_evento_en_ese_mes_calendario(db_session):
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    db_session.add_all([equipo, tarea, usuario])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=date(2026, 3, 15),
        )
    )
    db_session.commit()

    estado_marzo = estado_mes(db_session, 2026, 3)
    estado_abril = estado_mes(db_session, 2026, 4)

    assert estado_marzo[equipo.id][tarea.id] is True
    assert estado_abril[equipo.id][tarea.id] is False


def test_estado_mes_ignora_registros_de_otros_meses_aunque_esten_al_dia(db_session):
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=90)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    db_session.add_all([equipo, tarea, usuario])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=date(2026, 1, 5),
        )
    )
    db_session.commit()

    estado_febrero = estado_mes(db_session, 2026, 2)
    assert estado_febrero[equipo.id][tarea.id] is False
