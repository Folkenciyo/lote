from datetime import UTC, datetime

from pydantic import BaseModel
from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Equipo(Base):
    __tablename__ = "equipos"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    lote: Mapped[int] = mapped_column(Integer)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    marca: Mapped[str | None] = mapped_column(String(100), default=None)
    modelo: Mapped[str | None] = mapped_column(String(100), default=None)
    tipo: Mapped[str | None] = mapped_column(String(100), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class EquipoCreate(BaseModel):
    codigo: str
    lote: int
    marca: str | None = None
    modelo: str | None = None
    tipo: str | None = None


class EquipoUpdate(BaseModel):
    lote: int | None = None
    activo: bool | None = None
    marca: str | None = None
    modelo: str | None = None
    tipo: str | None = None


class EquipoOut(BaseModel):
    id: int
    codigo: str
    lote: int
    activo: bool
    marca: str | None
    modelo: str | None
    tipo: str | None

    model_config = {"from_attributes": True}
