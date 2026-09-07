from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.core.dependencies import require_supervisor
from app.core.security import (
    ALGORITHM,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.usuario import Usuario


def test_hash_password_verifica_correctamente():
    password_hash = hash_password("secreta123")
    assert password_hash != "secreta123"
    assert verify_password("secreta123", password_hash)
    assert not verify_password("otra-clave", password_hash)


def test_decode_access_token_valido():
    token = create_access_token(subject="a@a.com", rol="tecnico")
    payload = decode_access_token(token)
    assert payload["sub"] == "a@a.com"
    assert payload["rol"] == "tecnico"


def test_decode_access_token_expirado_lanza_error():
    expired_payload = {
        "sub": "a@a.com",
        "rol": "tecnico",
        "exp": datetime.now(UTC) - timedelta(minutes=1),
    }
    token = jwt.encode(expired_payload, settings.secret_key, algorithm=ALGORITHM)
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_decode_access_token_manipulado_lanza_error():
    token = create_access_token(subject="a@a.com", rol="tecnico")
    token_manipulado = token[:-1] + ("A" if token[-1] != "A" else "B")
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token_manipulado)


def test_require_supervisor_rechaza_tecnico():
    tecnico = Usuario(email="t@t.com", password_hash="x", nombre="T", rol="tecnico")
    with pytest.raises(HTTPException) as exc_info:
        require_supervisor(tecnico)
    assert exc_info.value.status_code == 403


def test_require_supervisor_acepta_supervisor():
    supervisor = Usuario(
        email="s@s.com", password_hash="x", nombre="S", rol="supervisor"
    )
    assert require_supervisor(supervisor) is supervisor


def test_login_credenciales_invalidas_devuelve_401(client, db_session):
    db_session.add(
        Usuario(
            email="user@x.com",
            password_hash=hash_password("correcta"),
            nombre="User",
            rol="tecnico",
        )
    )
    db_session.commit()

    response = client.post(
        "/api/auth/login",
        data={"username": "user@x.com", "password": "incorrecta"},
    )
    assert response.status_code == 401


def test_login_credenciales_validas_devuelve_token(client, db_session):
    db_session.add(
        Usuario(
            email="user@x.com",
            password_hash=hash_password("correcta"),
            nombre="User",
            rol="tecnico",
        )
    )
    db_session.commit()

    response = client.post(
        "/api/auth/login",
        data={"username": "user@x.com", "password": "correcta"},
    )
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
