"""Bootstrap del usuario supervisor a partir de variables de entorno.

No hay registro público: este script es la única forma de crear el primer
supervisor antes de que exista alguien que pueda usar POST /api/usuarios.
Es un upsert (no solo "crear si no existe"): si ADMIN_PASSWORD cambia y se
redespliega, la contraseña se actualiza. Sin esto, cambiar la contraseña de
producción exigiría entrar a la base de datos a mano.
"""

import os
import sys

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.usuario import Usuario, normalizar_email


def create_admin(
    db, email: str, password: str, nombre: str = "Administrador"
) -> Usuario:
    email = normalizar_email(email)
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario is not None:
        usuario.password_hash = hash_password(password)
        usuario.activo = True
        db.commit()
        db.refresh(usuario)
        return usuario

    usuario = Usuario(
        email=email,
        password_hash=hash_password(password),
        nombre=nombre,
        rol="supervisor",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


if __name__ == "__main__":
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_email or not admin_password:
        print("ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos", file=sys.stderr)
        sys.exit(1)

    session = SessionLocal()
    try:
        usuario = create_admin(session, admin_email, admin_password)
        print(f"Supervisor listo: {usuario.email}")
    finally:
        session.close()
