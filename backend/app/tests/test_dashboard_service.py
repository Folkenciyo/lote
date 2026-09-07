from datetime import date

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.dashboard_service import resumen_dashboard, resumen_lote


def test_resumen_lote_sin_equipos_no_lanza_error_y_da_0_por_ciento(db_session):
    resumen = resumen_lote(db_session, lote=999)
    assert resumen.total_equipos == 0
    assert resumen.total_pares == 0
    assert resumen.porcentaje_cumplimiento == 0.0


def test_resumen_lote_sin_ningun_registro_no_cuenta_como_cumplido(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add(tarea)
    db_session.add_all([Equipo(codigo=str(1000 + i), lote=1) for i in range(3)])
    db_session.commit()

    resumen = resumen_lote(db_session, lote=1, hoy=date.today())
    assert resumen.total_equipos == 3
    assert resumen.sin_registro == 3
    assert resumen.vencidos == 0
    assert resumen.porcentaje_cumplimiento == 0.0


def test_resumen_lote_todos_vencidos_da_0_por_ciento(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipos = [Equipo(codigo=str(1000 + i), lote=1) for i in range(3)]
    db_session.add_all([tarea, usuario, *equipos])
    db_session.commit()

    for equipo in equipos:
        db_session.add(
            Registro(
                equipo_id=equipo.id,
                tipo_tarea_id=tarea.id,
                usuario_id=usuario.id,
                fecha_realizada=date(2020, 1, 1),
            )
        )
    db_session.commit()

    resumen = resumen_lote(db_session, lote=1, hoy=date.today())
    assert resumen.total_equipos == 3
    assert resumen.vencidos == 3
    assert resumen.porcentaje_cumplimiento == 0.0


def test_resumen_lote_mezcla_calcula_porcentaje_correcto(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipo_al_dia = Equipo(codigo="1001", lote=1)
    equipo_vencido = Equipo(codigo="1002", lote=1)
    db_session.add_all([tarea, usuario, equipo_al_dia, equipo_vencido])
    db_session.commit()

    db_session.add_all(
        [
            Registro(
                equipo_id=equipo_al_dia.id,
                tipo_tarea_id=tarea.id,
                usuario_id=usuario.id,
                fecha_realizada=date.today(),
            ),
            Registro(
                equipo_id=equipo_vencido.id,
                tipo_tarea_id=tarea.id,
                usuario_id=usuario.id,
                fecha_realizada=date(2020, 1, 1),
            ),
        ]
    )
    db_session.commit()

    resumen = resumen_lote(db_session, lote=1, hoy=date.today())
    assert resumen.total_pares == 2
    assert resumen.vencidos == 1
    assert resumen.porcentaje_cumplimiento == 50.0


def test_resumen_dashboard_agrega_todos_los_lotes(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add(tarea)
    db_session.add_all([Equipo(codigo="1001", lote=1), Equipo(codigo="2001", lote=2)])
    db_session.commit()

    resumen = resumen_dashboard(db_session, hoy=date.today())
    assert resumen.total_equipos == 2
    assert {r.lote for r in resumen.por_lote} == {1, 2}
