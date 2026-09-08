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
        json={"codigo": "1002"},
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 403


def test_supervisor_puede_crear_equipo(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")

    response = client.post(
        "/api/equipos",
        json={"codigo": "1002"},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 201
    assert response.json()["codigo"] == "1002"


def test_crear_equipo_con_codigo_duplicado_devuelve_409(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    db_session.add(Equipo(codigo="1002"))
    db_session.commit()

    response = client.post(
        "/api/equipos",
        json={"codigo": "1002"},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 409


def test_listar_equipos_requiere_autenticacion(client):
    response = client.get("/api/equipos")
    assert response.status_code == 401


def test_listar_equipos_busca_por_codigo_parcial(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    db_session.add_all([Equipo(codigo="6306"), Equipo(codigo="9885")])
    db_session.commit()

    response = client.get("/api/equipos?codigo=630", headers=_auth_headers(tecnico))
    assert response.status_code == 200
    codigos = [e["codigo"] for e in response.json()]
    assert codigos == ["6306"]


def test_listar_equipos_busca_por_multiples_codigos_parciales(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    db_session.add_all(
        [
            Equipo(codigo="1045"),
            Equipo(codigo="4509"),
            Equipo(codigo="7777"),
        ]
    )
    db_session.commit()

    response = client.get(
        "/api/equipos?codigos=1045-119-4509-2265", headers=_auth_headers(tecnico)
    )
    assert response.status_code == 200
    codigos = sorted(e["codigo"] for e in response.json())
    assert codigos == ["1045", "4509"]


def test_listar_equipos_busca_por_codigos_separados_por_coma(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    db_session.add_all(
        [
            Equipo(codigo="1045"),
            Equipo(codigo="4509"),
            Equipo(codigo="7777"),
        ]
    )
    db_session.commit()

    response = client.get(
        "/api/equipos?codigos=1045, 119, 4509, 2265", headers=_auth_headers(tecnico)
    )
    assert response.status_code == 200
    codigos = sorted(e["codigo"] for e in response.json())
    assert codigos == ["1045", "4509"]


def test_crear_equipo_registra_quien_lo_dio_de_alta(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")

    response = client.post(
        "/api/equipos",
        json={"codigo": "1002", "observaciones": "cedido temporalmente"},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["creado_por_id"] == supervisor.id
    assert body["creado_por_nombre"] == supervisor.nombre
    assert body["observaciones"] == "cedido temporalmente"


def test_equipo_nace_con_estado_operativo_activo(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    response = client.post(
        "/api/equipos",
        json={"codigo": "1002"},
        headers=_auth_headers(supervisor),
    )
    assert response.json()["estado_operativo"] == "activo"


def test_tecnico_no_puede_cambiar_estado_operativo(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = Equipo(codigo="1002")
    db_session.add(equipo)
    db_session.commit()

    response = client.post(
        f"/api/equipos/{equipo.id}/estado",
        json={"estado_nuevo": "taller"},
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 403


def test_cambiar_estado_a_averiado(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo = Equipo(codigo="1002")
    db_session.add(equipo)
    db_session.commit()

    response = client.post(
        f"/api/equipos/{equipo.id}/estado",
        json={"estado_nuevo": "averiado", "motivo": "correa rota"},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 200
    assert response.json()["estado_operativo"] == "averiado"


def test_cambiar_estado_operativo_invalido_devuelve_422(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo = Equipo(codigo="1002")
    db_session.add(equipo)
    db_session.commit()

    response = client.post(
        f"/api/equipos/{equipo.id}/estado",
        json={"estado_nuevo": "reciclado"},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 422


def test_cambiar_estado_operativo_registra_el_cambio(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo = Equipo(codigo="1002")
    db_session.add(equipo)
    db_session.commit()

    response = client.post(
        f"/api/equipos/{equipo.id}/estado",
        json={"estado_nuevo": "taller", "motivo": "revision de frenos"},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 200
    assert response.json()["estado_operativo"] == "taller"

    historial = client.get(
        f"/api/equipos/{equipo.id}/cambios-estado", headers=_auth_headers(supervisor)
    )
    assert historial.status_code == 200
    cambios = historial.json()
    assert len(cambios) == 1
    assert cambios[0]["estado_anterior"] == "activo"
    assert cambios[0]["estado_nuevo"] == "taller"
    assert cambios[0]["motivo"] == "revision de frenos"
    assert cambios[0]["usuario_nombre"] == supervisor.nombre


def test_cambiar_al_mismo_estado_no_genera_registro(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo = Equipo(codigo="1002")
    db_session.add(equipo)
    db_session.commit()

    client.post(
        f"/api/equipos/{equipo.id}/estado",
        json={"estado_nuevo": "activo"},
        headers=_auth_headers(supervisor),
    )

    historial = client.get(
        f"/api/equipos/{equipo.id}/cambios-estado", headers=_auth_headers(supervisor)
    )
    assert historial.json() == []


def test_tecnico_puede_actualizar_lectura_actual(client, db_session):
    tecnico = _crear_usuario(db_session, "tec@x.com", "tecnico")
    equipo = Equipo(codigo="1002")
    db_session.add(equipo)
    db_session.commit()

    response = client.patch(
        f"/api/equipos/{equipo.id}/lectura",
        json={"lectura_actual_horas": 1500, "lectura_actual_km": 85000},
        headers=_auth_headers(tecnico),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["lectura_actual_horas"] == 1500
    assert body["lectura_actual_km"] == 85000


def test_actualizar_lectura_no_toca_otros_campos(client, db_session):
    supervisor = _crear_usuario(db_session, "sup@x.com", "supervisor")
    equipo = Equipo(codigo="1002", marca="Volvo")
    db_session.add(equipo)
    db_session.commit()

    response = client.patch(
        f"/api/equipos/{equipo.id}/lectura",
        json={"lectura_actual_horas": 200},
        headers=_auth_headers(supervisor),
    )
    assert response.status_code == 200
    assert response.json()["marca"] == "Volvo"
