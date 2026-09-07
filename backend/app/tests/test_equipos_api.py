from app.core.security import create_access_token, hash_password
from app.models.equipo import Equipo
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


def test_tecnico_no_puede_crear_equipo(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")

    response = client.post(
        "/api/equipos",
        json={"codigo": "1002", "lote": 1},
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 403


def test_supervisor_puede_crear_equipo(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")

    response = client.post(
        "/api/equipos",
        json={"codigo": "1002", "lote": 1},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 201
    assert response.json()["codigo"] == "1002"


def test_crear_equipo_con_codigo_duplicado_devuelve_409(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    db_session.add(Equipo(codigo="1002", lote=1))
    db_session.commit()

    response = client.post(
        "/api/equipos",
        json={"codigo": "1002", "lote": 1},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 409


def test_listar_equipos_requiere_autenticacion(client):
    response = client.get("/api/equipos")
    assert response.status_code == 401


def test_listar_equipos_filtra_por_lote(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    db_session.add_all([Equipo(codigo="1002", lote=1), Equipo(codigo="2001", lote=2)])
    db_session.commit()

    response = client.get("/api/equipos?lote=1", headers=_auth_headers(tecnico))
    assert response.status_code == 200
    codigos = [e["codigo"] for e in response.json()]
    assert codigos == ["1002"]
