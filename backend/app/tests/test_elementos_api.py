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


def _crear_equipo(db_session, codigo="1002"):
    equipo = Equipo(codigo=codigo)
    db_session.add(equipo)
    db_session.commit()
    return equipo


def test_tecnico_no_puede_crear_elemento(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = _crear_equipo(db_session)

    response = client.post(
        f"/api/equipos/{equipo.id}/elementos",
        json={"nombre": "Filtro de aceite", "referencia": "REF-1"},
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 403


def test_supervisor_puede_crear_y_listar_elementos(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo = _crear_equipo(db_session)

    creado = client.post(
        f"/api/equipos/{equipo.id}/elementos",
        json={"nombre": "Filtro de aceite", "referencia": "REF-1"},
        headers=_auth_headers(supervisor),
    )
    assert creado.status_code == 201
    assert creado.json()["referencia"] == "REF-1"

    listado = client.get(
        f"/api/equipos/{equipo.id}/elementos", headers=_auth_headers(supervisor)
    )
    assert listado.status_code == 200
    assert len(listado.json()) == 1


def test_referencia_duplicada_en_el_mismo_equipo_devuelve_409(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo = _crear_equipo(db_session)

    client.post(
        f"/api/equipos/{equipo.id}/elementos",
        json={"nombre": "Filtro de aceite", "referencia": "REF-1"},
        headers=_auth_headers(supervisor),
    )
    response = client.post(
        f"/api/equipos/{equipo.id}/elementos",
        json={"nombre": "Otro filtro", "referencia": "REF-1"},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 409


def test_misma_referencia_en_equipos_distintos_es_valida(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo_a = _crear_equipo(db_session, "1002")
    equipo_b = _crear_equipo(db_session, "1003")

    r1 = client.post(
        f"/api/equipos/{equipo_a.id}/elementos",
        json={"nombre": "Filtro de aceite", "referencia": "REF-1"},
        headers=_auth_headers(supervisor),
    )
    r2 = client.post(
        f"/api/equipos/{equipo_b.id}/elementos",
        json={"nombre": "Filtro de aceite", "referencia": "REF-1"},
        headers=_auth_headers(supervisor),
    )
    assert r1.status_code == 201
    assert r2.status_code == 201


def test_tecnico_no_puede_eliminar_elemento(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = _crear_equipo(db_session)

    creado = client.post(
        f"/api/equipos/{equipo.id}/elementos",
        json={"nombre": "Filtro de aceite", "referencia": "REF-1"},
        headers=_auth_headers(supervisor),
    )
    elemento_id = creado.json()["id"]

    response = client.delete(
        f"/api/elementos/{elemento_id}", headers=_auth_headers(tecnico)
    )
    assert response.status_code == 403
