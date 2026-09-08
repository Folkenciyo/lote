from app.core.security import create_access_token, hash_password
from app.models.equipo import Equipo
from app.models.etiqueta import Etiqueta
from app.models.usuario import Usuario


def _auth_headers(db_session, email="tec@x.com", rol="tecnico"):
    usuario = Usuario(
        email=email, password_hash=hash_password("x"), nombre=email, rol=rol
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject=usuario.email, rol=usuario.rol)
    return {"Authorization": f"Bearer {token}"}, usuario


def test_listar_etiquetas_requiere_autenticacion(client):
    response = client.get("/api/etiquetas")
    assert response.status_code == 401


def test_tecnico_no_puede_crear_etiqueta(client, db_session):
    headers, _ = _auth_headers(db_session)
    response = client.post(
        "/api/etiquetas",
        json={
            "nombre": "Neumático pinchado",
            "estado_operativo": "taller",
            "color": "red",
        },
        headers=headers,
    )
    assert response.status_code == 403


def test_supervisor_puede_crear_etiqueta(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    response = client.post(
        "/api/etiquetas",
        json={
            "nombre": "Neumático pinchado",
            "estado_operativo": "taller",
            "color": "red",
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nombre"] == "Neumático pinchado"
    assert body["estado_operativo"] == "taller"
    assert body["color"] == "red"


def test_crear_etiqueta_con_estado_invalido_devuelve_422(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    response = client.post(
        "/api/etiquetas",
        json={"nombre": "X", "estado_operativo": "reciclado", "color": "red"},
        headers=headers,
    )
    assert response.status_code == 422


def test_crear_etiqueta_con_color_invalido_devuelve_422(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    response = client.post(
        "/api/etiquetas",
        json={"nombre": "X", "estado_operativo": "taller", "color": "dorado"},
        headers=headers,
    )
    assert response.status_code == 422


def test_crear_etiqueta_con_nombre_duplicado_devuelve_409(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    db_session.add(
        Etiqueta(nombre="Averiado motor", estado_operativo="averiado", color="orange")
    )
    db_session.commit()

    response = client.post(
        "/api/etiquetas",
        json={"nombre": "Averiado motor", "estado_operativo": "taller", "color": "red"},
        headers=headers,
    )
    assert response.status_code == 409


def test_supervisor_puede_editar_etiqueta(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    etiqueta = Etiqueta(nombre="X", estado_operativo="taller", color="red")
    db_session.add(etiqueta)
    db_session.commit()

    response = client.patch(
        f"/api/etiquetas/{etiqueta.id}",
        json={"color": "blue"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["color"] == "blue"


def test_supervisor_puede_eliminar_etiqueta(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    etiqueta = Etiqueta(nombre="X", estado_operativo="taller", color="red")
    db_session.add(etiqueta)
    db_session.commit()

    response = client.delete(f"/api/etiquetas/{etiqueta.id}", headers=headers)
    assert response.status_code == 204
    assert client.get("/api/etiquetas", headers=headers).json() == []


def test_asignar_y_listar_etiquetas_de_un_equipo(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    equipo = Equipo(codigo="1002")
    etiqueta = Etiqueta(
        nombre="Neumático pinchado", estado_operativo="taller", color="red"
    )
    db_session.add_all([equipo, etiqueta])
    db_session.commit()

    response = client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta.id},
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["etiqueta"]["nombre"] == "Neumático pinchado"

    listado = client.get(f"/api/equipos/{equipo.id}/etiquetas", headers=headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


def test_tecnico_no_puede_asignar_etiqueta(client, db_session):
    headers, _ = _auth_headers(db_session)
    equipo = Equipo(codigo="1002")
    etiqueta = Etiqueta(nombre="X", estado_operativo="taller", color="red")
    db_session.add_all([equipo, etiqueta])
    db_session.commit()

    response = client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta.id},
        headers=headers,
    )
    assert response.status_code == 403


def test_asignar_etiqueta_ya_asignada_devuelve_409(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    equipo = Equipo(codigo="1002")
    etiqueta = Etiqueta(nombre="X", estado_operativo="taller", color="red")
    db_session.add_all([equipo, etiqueta])
    db_session.commit()

    client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta.id},
        headers=headers,
    )
    response = client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta.id},
        headers=headers,
    )
    assert response.status_code == 409


def test_un_equipo_puede_tener_varias_etiquetas_a_la_vez(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    equipo = Equipo(codigo="1002")
    etiqueta_1 = Etiqueta(
        nombre="Neumático pinchado", estado_operativo="taller", color="red"
    )
    etiqueta_2 = Etiqueta(
        nombre="Pendiente ITV", estado_operativo="averiado", color="orange"
    )
    db_session.add_all([equipo, etiqueta_1, etiqueta_2])
    db_session.commit()

    client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta_1.id},
        headers=headers,
    )
    client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta_2.id},
        headers=headers,
    )

    listado = client.get(f"/api/equipos/{equipo.id}/etiquetas", headers=headers)
    assert len(listado.json()) == 2


def test_quitar_etiqueta_de_un_equipo(client, db_session):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    equipo = Equipo(codigo="1002")
    etiqueta = Etiqueta(nombre="X", estado_operativo="taller", color="red")
    db_session.add_all([equipo, etiqueta])
    db_session.commit()

    client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta.id},
        headers=headers,
    )
    response = client.delete(
        f"/api/equipos/{equipo.id}/etiquetas/{etiqueta.id}", headers=headers
    )
    assert response.status_code == 204

    listado = client.get(f"/api/equipos/{equipo.id}/etiquetas", headers=headers)
    assert listado.json() == []


def test_eliminar_etiqueta_del_catalogo_borra_tambien_sus_asignaciones(
    client, db_session
):
    headers, _ = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    equipo = Equipo(codigo="1002")
    etiqueta = Etiqueta(nombre="X", estado_operativo="taller", color="red")
    db_session.add_all([equipo, etiqueta])
    db_session.commit()

    client.post(
        f"/api/equipos/{equipo.id}/etiquetas",
        json={"etiqueta_id": etiqueta.id},
        headers=headers,
    )
    response = client.delete(f"/api/etiquetas/{etiqueta.id}", headers=headers)
    assert response.status_code == 204

    listado = client.get(f"/api/equipos/{equipo.id}/etiquetas", headers=headers)
    assert listado.json() == []
