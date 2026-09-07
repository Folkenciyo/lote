from datetime import date

from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario
from app.services.estado_service import EstadoTarea
from app.services.pdf_service import cargar_historial_con_usuario, generar_pdf_equipo


def test_generar_pdf_equipo_devuelve_bytes_pdf_validos():
    equipo = Equipo(id=1, codigo="1002", lote=1)
    estados = [
        EstadoTarea(
            tipo_tarea_id=1,
            tipo_tarea_nombre="ACEITE",
            periodicidad_dias=30,
            fecha_ultimo_registro=date(2026, 1, 1),
            estado="al_dia",
        )
    ]

    contenido = generar_pdf_equipo(equipo, estados, historial=[])

    assert contenido.startswith(b"%PDF")
    assert len(contenido) > 0


def test_cargar_historial_con_usuario_incluye_nombre_usuario_y_tarea(db_session):
    equipo = Equipo(codigo="1002", lote=1)
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    usuario = Usuario(email="a@a.com", password_hash="x", nombre="Ana", rol="tecnico")
    db_session.add_all([equipo, tarea, usuario])
    db_session.commit()

    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=date(2026, 1, 1),
            observaciones="cambio de filtro",
        )
    )
    db_session.commit()

    historial = cargar_historial_con_usuario(db_session, equipo.id)

    assert len(historial) == 1
    registro, nombre_usuario, nombre_tarea = historial[0]
    assert nombre_usuario == "Ana"
    assert nombre_tarea == "ACEITE"
    assert registro.observaciones == "cambio de filtro"


def test_generar_pdf_equipo_con_historial_no_lanza_error():
    equipo = Equipo(id=1, codigo="1002", lote=1)
    registro = Registro(
        id=1,
        equipo_id=1,
        tipo_tarea_id=1,
        usuario_id=1,
        fecha_realizada=date(2026, 1, 1),
        observaciones=None,
    )

    contenido = generar_pdf_equipo(equipo, [], historial=[(registro, "Ana", "ACEITE")])

    assert contenido.startswith(b"%PDF")
