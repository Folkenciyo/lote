from app.core.security import verify_password
from app.scripts.create_admin import create_admin


def test_create_admin_reusa_el_mismo_usuario_si_ya_existe(db_session):
    primero = create_admin(db_session, "admin@x.com", "clave123")
    segundo = create_admin(db_session, "admin@x.com", "otra-clave")

    assert primero.id == segundo.id
    assert primero.rol == "supervisor"


def test_create_admin_actualiza_la_contrasena_si_el_usuario_ya_existe(db_session):
    create_admin(db_session, "admin@x.com", "clave-vieja")
    actualizado = create_admin(db_session, "admin@x.com", "clave-nueva")

    assert verify_password("clave-nueva", actualizado.password_hash)
    assert not verify_password("clave-vieja", actualizado.password_hash)
