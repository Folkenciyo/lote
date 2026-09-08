from app.core.security import create_access_token, hash_password
from app.models.usuario import Usuario


def _auth_headers(db_session, email="tec@x.com", rol="tecnico"):
    usuario = Usuario(
        email=email, password_hash=hash_password("x"), nombre=email, rol=rol
    )
    db_session.add(usuario)
    db_session.commit()
    token = create_access_token(subject=usuario.email, rol=usuario.rol)
    return {"Authorization": f"Bearer {token}"}


def test_listar_tipos_tarea_requiere_autenticacion(client):
    response = client.get("/api/tipos-tarea")
    assert response.status_code == 401


def test_listar_tipos_tarea_devuelve_catalogo_sembrado(client, db_session_with_tareas):
    headers = _auth_headers(db_session_with_tareas)
    response = client.get("/api/tipos-tarea", headers=headers)
    assert response.status_code == 200
    nombres = {t["nombre"] for t in response.json()}
    assert "ACEITE" in nombres
    assert "F_GASOIL" in nombres


def test_tecnico_no_puede_crear_tipo_tarea(client, db_session):
    headers = _auth_headers(db_session)
    response = client.post(
        "/api/tipos-tarea",
        json={
            "nombre": "FRENOS",
            "categoria": "mantenimiento",
            "periodicidad_dias": 180,
        },
        headers=headers,
    )
    assert response.status_code == 403


def test_supervisor_puede_crear_tipo_tarea(client, db_session):
    headers = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    response = client.post(
        "/api/tipos-tarea",
        json={
            "nombre": "FRENOS",
            "categoria": "mantenimiento",
            "periodicidad_dias": 180,
        },
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["nombre"] == "FRENOS"


def test_crear_tipo_tarea_con_categoria_invalida_devuelve_422(client, db_session):
    headers = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    response = client.post(
        "/api/tipos-tarea",
        json={"nombre": "FRENOS", "categoria": "otra", "periodicidad_dias": 180},
        headers=headers,
    )
    assert response.status_code == 422


def test_supervisor_puede_actualizar_periodicidad(client, db_session_with_tareas):
    headers = _auth_headers(db_session_with_tareas, email="sup@x.com", rol="supervisor")
    listado = client.get("/api/tipos-tarea", headers=headers).json()
    tarea_id = next(t["id"] for t in listado if t["nombre"] == "ACEITE")

    response = client.patch(
        f"/api/tipos-tarea/{tarea_id}",
        json={"periodicidad_dias": 45},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["periodicidad_dias"] == 45


def test_crear_tipo_tarea_con_limite_horas(client, db_session):
    headers = _auth_headers(db_session, email="sup@x.com", rol="supervisor")
    response = client.post(
        "/api/tipos-tarea",
        json={
            "nombre": "FRENOS",
            "categoria": "mantenimiento",
            "periodicidad_dias": 180,
            "limite_horas": 250,
        },
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["limite_horas"] == 250


def test_tipo_tarea_sin_limite_horas_devuelve_null(client, db_session_with_tareas):
    headers = _auth_headers(db_session_with_tareas, email="sup@x.com", rol="supervisor")
    listado = client.get("/api/tipos-tarea", headers=headers).json()
    aceite = next(t for t in listado if t["nombre"] == "ACEITE")
    assert aceite["limite_horas"] is None
