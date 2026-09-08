from datetime import date

from app.core.security import create_access_token, hash_password
from app.models.equipo import Equipo
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario


def _crear_usuario(db_session, email, rol):
    usuario = Usuario(
        email=email, password_hash=hash_password("x"), nombre=email, rol=rol
    )
    db_session.add(usuario)
    db_session.commit()
    return usuario


def _auth_headers(usuario):
    token = create_access_token(subject=usuario.email, rol=usuario.rol)
    return {"Authorization": f"Bearer {token}"}


def test_crear_registro_usa_usuario_del_token_no_del_body(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    otro = _crear_usuario(db_session, "otro@x.com", "tecnico")
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add_all([equipo, tarea])
    db_session.commit()

    response = client.post(
        "/api/registros",
        json={
            "equipo_id": equipo.id,
            "tipo_tarea_id": tarea.id,
            "fecha_realizada": str(date.today()),
            "usuario_id": otro.id,  # debe ser ignorado
        },
        headers=_auth_headers(tecnico),
    )

    assert response.status_code == 201
    assert response.json()["usuario_id"] == tecnico.id


def test_crear_registro_equipo_inexistente_devuelve_404(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add(tarea)
    db_session.commit()

    response = client.post(
        "/api/registros",
        json={
            "equipo_id": 9999,
            "tipo_tarea_id": tarea.id,
            "fecha_realizada": str(date.today()),
        },
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 404


def test_eliminar_registro_requiere_supervisor(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add_all([equipo, tarea])
    db_session.commit()

    creado = client.post(
        "/api/registros",
        json={
            "equipo_id": equipo.id,
            "tipo_tarea_id": tarea.id,
            "fecha_realizada": str(date.today()),
        },
        headers=_auth_headers(tecnico),
    )
    registro_id = creado.json()["id"]

    response = client.delete(
        f"/api/registros/{registro_id}", headers=_auth_headers(tecnico)
    )
    assert response.status_code == 403


def test_listar_registros_incluye_codigo_de_equipo(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add_all([equipo, tarea])
    db_session.commit()

    client.post(
        "/api/registros",
        json={
            "equipo_id": equipo.id,
            "tipo_tarea_id": tarea.id,
            "fecha_realizada": str(date.today()),
        },
        headers=_auth_headers(tecnico),
    )

    response = client.get("/api/registros", headers=_auth_headers(tecnico))
    assert response.status_code == 200
    assert response.json()[0]["equipo_codigo"] == "1002"


def test_crear_registro_guarda_horas_y_kilometros(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add_all([equipo, tarea])
    db_session.commit()

    response = client.post(
        "/api/registros",
        json={
            "equipo_id": equipo.id,
            "tipo_tarea_id": tarea.id,
            "fecha_realizada": str(date.today()),
            "horas_trabajo": 1200,
            "kilometros": 85000,
        },
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 201
    assert response.json()["horas_trabajo"] == 1200
    assert response.json()["kilometros"] == 85000


def test_crear_registro_sin_horas_ni_kilometros_devuelve_null(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = Equipo(codigo="1002")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add_all([equipo, tarea])
    db_session.commit()

    response = client.post(
        "/api/registros",
        json={
            "equipo_id": equipo.id,
            "tipo_tarea_id": tarea.id,
            "fecha_realizada": str(date.today()),
        },
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 201
    assert response.json()["horas_trabajo"] is None
    assert response.json()["kilometros"] is None
