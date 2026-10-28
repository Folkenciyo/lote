from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(subject: str, rol: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "rol": rol, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])


TIPO_ENLACE_EQUIPO = "compartir_equipo"
DURACION_ENLACE_EQUIPO = timedelta(days=7)


def create_share_token(equipo_id: int) -> tuple[str, datetime]:
    """Enlace público de solo lectura a la ficha de un equipo. Lleva un `tipo`
    propio para que no sirva como token de sesión ni al revés."""
    expira = (datetime.now(UTC) + DURACION_ENLACE_EQUIPO).replace(microsecond=0)
    payload = {"sub": str(equipo_id), "tipo": TIPO_ENLACE_EQUIPO, "exp": expira}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM), expira


def decode_share_token(token: str) -> tuple[int, datetime]:
    """Lanza `jwt.ExpiredSignatureError` si caducó y `jwt.InvalidTokenError`
    si no es un enlace de equipo válido."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    if payload.get("tipo") != TIPO_ENLACE_EQUIPO:
        raise jwt.InvalidTokenError("No es un enlace de equipo")
    return int(payload["sub"]), datetime.fromtimestamp(payload["exp"], UTC)
