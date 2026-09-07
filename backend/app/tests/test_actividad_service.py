from datetime import date

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.actividad_service import actividad_por_usuario


def _seed(db_session):
    equipo = Equipo(codigo="1002", lote=1)
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    tecnico1 = Usuario(email="t1@x.com", password_hash="x", nombre="Ana", rol="tecnico")
    tecnico2 = Usuario(
        email="t2@x.com", password_hash="x", nombre="Luis", rol="tecnico"
    )
    db_session.add_all([equipo, tarea, tecnico1, tecnico2])
    db_session.commit()
    return equipo, tarea, tecnico1, tecnico2


def test_actividad_por_usuario_cuenta_registros_correctamente(db_session):
    equipo, tarea, tecnico1, tecnico2 = _seed(db_session)
    db_session.add_all(
        [
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=tecnico1.id,
                fecha_realizada=date(2026, 1, 1),
            ),
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=tecnico1.id,
                fecha_realizada=date(2026, 1, 5),
            ),
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=tecnico2.id,
                fecha_realizada=date(2026, 1, 3),
            ),
        ]
    )
    db_session.commit()

    actividad = actividad_por_usuario(db_session)

    por_nombre = {a.nombre: a.total_registros for a in actividad}
    assert por_nombre == {"Ana": 2, "Luis": 1}
    assert actividad[0].nombre == "Ana"  # ordenado desc por total


def test_actividad_por_usuario_filtra_por_rango_de_fechas(db_session):
    equipo, tarea, tecnico1, _ = _seed(db_session)
    db_session.add_all(
        [
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=tecnico1.id,
                fecha_realizada=date(2026, 1, 1),
            ),
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=tecnico1.id,
                fecha_realizada=date(2026, 2, 1),
            ),
        ]
    )
    db_session.commit()

    actividad_enero = actividad_por_usuario(
        db_session, desde=date(2026, 1, 1), hasta=date(2026, 1, 31)
    )

    assert len(actividad_enero) == 1
    assert actividad_enero[0].total_registros == 1


def test_actividad_por_usuario_sin_registros_no_aparece(db_session):
    _seed(db_session)
    assert actividad_por_usuario(db_session) == []
