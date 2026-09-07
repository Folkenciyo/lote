from datetime import UTC, datetime

from pydantic import BaseModel, EmailStr
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

ROLES = ("tecnico", "supervisor")


def normalizar_email(email: str) -> str:
    """El email se guarda y se compara siempre en minúsculas: un móvil que
    autocapitaliza la primera letra, o un email tecleado con mayúsculas
    distintas a como se creó, no debe romper el login."""
    return email.strip().lower()


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    nombre: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(String(20))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    rol: str


class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    rol: str | None = None
    activo: bool | None = None
    password: str | None = None


class UsuarioOut(BaseModel):
    id: int
    email: str
    nombre: str
    rol: str
    activo: bool

    model_config = {"from_attributes": True}
