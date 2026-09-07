from app.core.security import create_access_token, hash_password
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


def test_tecnico_no_puede_crear_usuarios(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")

    response = client.post(
        "/api/usuarios",
        json={
            "email": "nuevo@x.com",
            "password": "clave123",
            "nombre": "Nuevo",
            "rol": "tecnico",
        },
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 403


def test_tecnico_no_puede_autopromoverse(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")

    response = client.patch(
        f"/api/usuarios/{tecnico.id}",
        json={"rol": "supervisor"},
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 403

    db_session.refresh(tecnico)
    assert tecnico.rol == "tecnico"


def test_supervisor_puede_crear_y_promover_usuarios(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")

    creado = client.post(
        "/api/usuarios",
        json={
            "email": "nuevo@x.com",
            "password": "clave123",
            "nombre": "Nuevo",
            "rol": "tecnico",
        },
        headers=_auth_headers(supervisor),
    )
    assert creado.status_code == 201
    nuevo_id = creado.json()["id"]

    promovido = client.patch(
        f"/api/usuarios/{nuevo_id}",
        json={"rol": "supervisor"},
        headers=_auth_headers(supervisor),
    )
    assert promovido.status_code == 200
    assert promovido.json()["rol"] == "supervisor"
