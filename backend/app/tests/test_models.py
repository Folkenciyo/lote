import pytest
from sqlalchemy.exc import IntegrityError

from app.models.equipo import Equipo
from app.models.tipo_tarea import CATALOGO_TAREAS, TipoTarea
from app.models.usuario import Usuario


def test_seed_catalogo_inserta_8_tareas_con_categoria_correcta(db_session):
    for nombre, categoria in CATALOGO_TAREAS:
        db_session.add(TipoTarea(nombre=nombre, categoria=categoria))
    db_session.commit()

    tareas = db_session.query(TipoTarea).all()
    assert len(tareas) == 8

    por_nombre = {t.nombre: t.categoria for t in tareas}
    assert por_nombre["ACEITE"] == "engrase"
    assert por_nombre["CAJA_C"] == "engrase"
    assert por_nombre["ENGRASE"] == "engrase"
    assert por_nombre["GRUPO"] == "engrase"
    assert por_nombre["F_GASOIL"] == "mantenimiento"
    assert por_nombre["HIDRAULICO"] == "mantenimiento"
    assert por_nombre["F_AIRE"] == "mantenimiento"
    assert por_nombre["F_SECANTE"] == "mantenimiento"


def test_codigo_equipo_duplicado_lanza_integrity_error(db_session):
    db_session.add(Equipo(codigo="1002", lote=1))
    db_session.commit()

    db_session.add(Equipo(codigo="1002", lote=1))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_email_usuario_duplicado_lanza_integrity_error(db_session):
    db_session.add(
        Usuario(email="a@a.com", password_hash="x", nombre="A", rol="tecnico")
    )
    db_session.commit()

    db_session.add(
        Usuario(email="a@a.com", password_hash="y", nombre="B", rol="supervisor")
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
