"""Bootstrap del primer usuario supervisor a partir de variables de entorno.

No hay registro público: este script es la única forma de crear el primer
supervisor antes de que exista alguien que pueda usar POST /api/usuarios.
"""

import os
import sys

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.usuario import Usuario


def create_admin(
    db, email: str, password: str, nombre: str = "Administrador"
) -> Usuario:
    existente = db.query(Usuario).filter(Usuario.email == email).first()
    if existente is not None:
        return existente

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
