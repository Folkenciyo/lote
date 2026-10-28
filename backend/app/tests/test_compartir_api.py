from datetime import UTC, date, datetime, timedelta

import jwt

from app.core.config import settings
from app.core.security import ALGORITHM, create_access_token, hash_password
from app.models.equipo import Equipo
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario


def _crear_usuario(db_session, email="tec@x.com", rol="tecnico"):
    usuario = Usuario(
        email=email, password_hash=hash_password("x"), nombre="Ana Tecnica", rol=rol
    )
    db_session.add(usuario)
    db_session.commit()
    return usuario


def _auth_headers(usuario):
    token = create_access_token(subject=usuario.email, rol=usuario.rol)
    return {"Authorization": f"Bearer {token}"}


def _equipo_con_registro(db_session, usuario):
    equipo = Equipo(codigo="1150", marca="Volvo", estado_operativo="averiado")
    tarea = TipoTarea(nombre="ACEITE", categoria="engrase", periodicidad_dias=30)
    db_session.add_all([equipo, tarea])
    db_session.commit()
    db_session.add(
        Registro(
            equipo_id=equipo.id,
            tipo_tarea_id=tarea.id,
            usuario_id=usuario.id,
            fecha_realizada=date.today(),
            observaciones="fuga en el carter",
        )
    )
    db_session.commit()
    return equipo


def _crear_enlace(client, usuario, equipo):
    response = client.post(
        f"/api/compartir/equipo/{equipo.id}", headers=_auth_headers(usuario)
    )
    assert response.status_code == 201
    return response.json()


def test_crear_enlace_requiere_sesion(client, db_session):
    usuario = _crear_usuario(db_session)
    equipo = _equipo_con_registro(db_session, usuario)

    response = client.post(f"/api/compartir/equipo/{equipo.id}")
    assert response.status_code == 401


def test_crear_enlace_caduca_en_7_dias(client, db_session):
    usuario = _crear_usuario(db_session)
    equipo = _equipo_con_registro(db_session, usuario)

    enlace = _crear_enlace(client, usuario, equipo)

    expira = datetime.fromisoformat(enlace["expira"])
    restante = expira - datetime.now(UTC)
    assert timedelta(days=6, hours=23) < restante <= timedelta(days=7)
    assert enlace["token"]


def test_crear_enlace_de_equipo_inexistente_devuelve_404(client, db_session):
    usuario = _crear_usuario(db_session)

    response = client.post("/api/compartir/equipo/9999", headers=_auth_headers(usuario))
    assert response.status_code == 404


def test_vista_publica_sin_sesion_muestra_resumen_e_historial(client, db_session):
    usuario = _crear_usuario(db_session)
    equipo = _equipo_con_registro(db_session, usuario)
    enlace = _crear_enlace(client, usuario, equipo)

    response = client.get(f"/api/publico/equipo/{enlace['token']}")

    assert response.status_code == 200
    datos = response.json()
    assert datos["codigo"] == "1150"
    assert datos["marca"] == "Volvo"
    assert datos["estado_operativo"] == "averiado"
    assert datos["estados"][0]["observaciones_ultimo_registro"] == ("fuga en el carter")
    assert datos["historial"][0]["usuario_nombre"] == "Ana Tecnica"
    assert datos["expira"] == enlace["expira"]


def test_pdf_publico_sin_sesion(client, db_session):
    usuario = _crear_usuario(db_session)
    equipo = _equipo_con_registro(db_session, usuario)
    enlace = _crear_enlace(client, usuario, equipo)

    response = client.get(f"/api/publico/equipo/{enlace['token']}/pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_enlace_caducado_devuelve_410(client, db_session):
    usuario = _crear_usuario(db_session)
    equipo = _equipo_con_registro(db_session, usuario)
    token = jwt.encode(
        {
            "sub": str(equipo.id),
            "tipo": "compartir_equipo",
            "exp": datetime.now(UTC) - timedelta(minutes=1),
        },
        settings.secret_key,
        algorithm=ALGORITHM,
    )

    response = client.get(f"/api/publico/equipo/{token}")
    assert response.status_code == 410


def test_token_manipulado_devuelve_404(client, db_session):
    usuario = _crear_usuario(db_session)
    equipo = _equipo_con_registro(db_session, usuario)
    enlace = _crear_enlace(client, usuario, equipo)

    response = client.get(f"/api/publico/equipo/{enlace['token']}x")
    assert response.status_code == 404


def test_token_de_sesion_no_sirve_como_enlace_publico(client, db_session):
    usuario = _crear_usuario(db_session)
    _equipo_con_registro(db_session, usuario)
    token_sesion = create_access_token(subject=usuario.email, rol=usuario.rol)

    response = client.get(f"/api/publico/equipo/{token_sesion}")
    assert response.status_code == 404


def test_enlace_publico_no_sirve_como_sesion(client, db_session):
    usuario = _crear_usuario(db_session)
    equipo = _equipo_con_registro(db_session, usuario)
    enlace = _crear_enlace(client, usuario, equipo)

    response = client.get(
        "/api/equipos", headers={"Authorization": f"Bearer {enlace['token']}"}
    )
    assert response.status_code == 401
