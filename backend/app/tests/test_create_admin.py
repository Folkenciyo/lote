from app.scripts.create_admin import create_admin


def test_create_admin_es_idempotente(db_session):
    primero = create_admin(db_session, "admin@x.com", "clave123")
    segundo = create_admin(db_session, "admin@x.com", "otra-clave")

    assert primero.id == segundo.id
    assert primero.rol == "supervisor"
