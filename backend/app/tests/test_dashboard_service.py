from datetime import date

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.dashboard_service import avisos_categoria, resumen_dashboard


def test_resumen_dashboard_sin_equipos_no_lanza_error_y_da_0_por_ciento(db_session):
    resumen = resumen_dashboard(db_session)
    assert resumen.total_equipos == 0
    assert resumen.total_pares == 0
    assert resumen.porcentaje_cumplimiento == 0.0


def test_resumen_dashboard_sin_ningun_registro_no_cuenta_como_cumplido(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add(tarea)
    db_session.add_all([Equipo(codigo=str(1000 + i)) for i in range(3)])
    db_session.commit()

    resumen = resumen_dashboard(db_session, hoy=date.today())
    assert resumen.total_equipos == 3
    assert resumen.total_sin_registro == 3
    assert resumen.total_vencidos == 0
    assert resumen.porcentaje_cumplimiento == 0.0


def test_resumen_dashboard_todos_vencidos_da_0_por_ciento(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipos = [Equipo(codigo=str(1000 + i)) for i in range(3)]
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

    resumen = resumen_dashboard(db_session, hoy=date.today())
    assert resumen.total_equipos == 3
    assert resumen.total_vencidos == 3
    assert resumen.porcentaje_cumplimiento == 0.0


def test_resumen_dashboard_mezcla_calcula_porcentaje_correcto(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipo_al_dia = Equipo(codigo="1001")
    equipo_vencido = Equipo(codigo="1002")
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

    resumen = resumen_dashboard(db_session, hoy=date.today())
    assert resumen.total_pares == 2
    assert resumen.total_vencidos == 1
    assert resumen.porcentaje_cumplimiento == 50.0


def test_resumen_dashboard_agrega_todos_los_equipos(db_session):
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add(tarea)
    db_session.add_all([Equipo(codigo="1001"), Equipo(codigo="2001")])
    db_session.commit()

    resumen = resumen_dashboard(db_session, hoy=date.today())
    assert resumen.total_equipos == 2


def test_avisos_categoria_ignora_tareas_de_engrase_vencidas(db_session):
    """Una tarea de engrase (mensual) vencida no debe disparar el aviso de
    mantenimiento semestral — son dos cosas distintas."""
    engrase = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipo = Equipo(codigo="1001")
    db_session.add_all([engrase, usuario, equipo])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=engrase.id,
            usuario_id=usuario.id,
            fecha_realizada=date(2020, 1, 1),
        )
    )
    db_session.commit()

    aviso = avisos_categoria(db_session, "mantenimiento", hoy=date.today())
    assert aviso.total_vencidos == 0
    assert aviso.codigos_equipos == []


def test_avisos_categoria_detecta_tarea_de_mantenimiento_vencida(db_session):
    mantenimiento = TipoTarea(
        nombre="F_GASOIL", categoria="mantenimiento", periodicidad_dias=180
    )
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipo_vencido = Equipo(codigo="1001")
    equipo_al_dia = Equipo(codigo="1002")
    db_session.add_all([mantenimiento, usuario, equipo_vencido, equipo_al_dia])
    db_session.commit()

    db_session.add_all(
        [
            Registro(
                equipo_id=equipo_vencido.id,
                tipo_tarea_id=mantenimiento.id,
                usuario_id=usuario.id,
                fecha_realizada=date(2020, 1, 1),
            ),
            Registro(
                equipo_id=equipo_al_dia.id,
                tipo_tarea_id=mantenimiento.id,
                usuario_id=usuario.id,
                fecha_realizada=date.today(),
            ),
        ]
    )
    db_session.commit()

    aviso = avisos_categoria(db_session, "mantenimiento", hoy=date.today())
    assert aviso.total_vencidos == 1
    assert aviso.codigos_equipos == ["1001"]


def test_avisos_categoria_detecta_engrase_vencido(db_session):
    engrase = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipo = Equipo(codigo="1003")
    db_session.add_all([engrase, usuario, equipo])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=engrase.id,
            usuario_id=usuario.id,
            fecha_realizada=date(2020, 1, 1),
        )
    )
    db_session.commit()

    aviso = avisos_categoria(db_session, "engrase", hoy=date.today())
    assert aviso.total_vencidos == 1
    assert aviso.codigos_equipos == ["1003"]


def test_avisos_categoria_ignora_equipos_de_baja(db_session):
    mantenimiento = TipoTarea(
        nombre="F_GASOIL", categoria="mantenimiento", periodicidad_dias=180
    )
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipo_baja = Equipo(codigo="1001", estado_operativo="baja")
    equipo_taller = Equipo(codigo="1002", estado_operativo="taller")
    db_session.add_all([mantenimiento, usuario, equipo_baja, equipo_taller])
    db_session.commit()

    db_session.add_all(
        [
            Registro(
                equipo_id=equipo_baja.id,
                tipo_tarea_id=mantenimiento.id,
                usuario_id=usuario.id,
                fecha_realizada=date(2020, 1, 1),
            ),
            Registro(
                equipo_id=equipo_taller.id,
                tipo_tarea_id=mantenimiento.id,
                usuario_id=usuario.id,
                fecha_realizada=date(2020, 1, 1),
            ),
        ]
    )
    db_session.commit()

    aviso = avisos_categoria(db_session, "mantenimiento", hoy=date.today())
    assert aviso.codigos_equipos == ["1002"]


def test_avisos_categoria_detecta_vencido_por_horas(db_session):
    tarea = TipoTarea(
        nombre="F_GASOIL",
        categoria="mantenimiento",
        periodicidad_dias=180,
        limite_horas=250,
    )
    usuario = Usuario(email="u@u.com", password_hash="x", nombre="U", rol="tecnico")
    equipo = Equipo(codigo="1001", lectura_actual_horas=1500)
    db_session.add_all([tarea, usuario, equipo])
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

    aviso = avisos_categoria(db_session, "mantenimiento", hoy=date.today())
    assert aviso.codigos_equipos == ["1001"]
