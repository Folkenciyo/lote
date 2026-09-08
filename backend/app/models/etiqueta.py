from datetime import UTC, datetime

from pydantic import BaseModel
from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

COLORES_ETIQUETA = (
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "gray",
)


class Etiqueta(Base):
    __tablename__ = "etiquetas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True)
    estado_operativo: Mapped[str] = mapped_column(String(20))
    color: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class EquipoEtiqueta(Base):
    __tablename__ = "equipo_etiquetas"
    __table_args__ = (UniqueConstraint("equipo_id", "etiqueta_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"))
    etiqueta_id: Mapped[int] = mapped_column(ForeignKey("etiquetas.id"))
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class EtiquetaCreate(BaseModel):
    nombre: str
    estado_operativo: str
    color: str


class EtiquetaUpdate(BaseModel):
    nombre: str | None = None
    estado_operativo: str | None = None
    color: str | None = None


class EtiquetaOut(BaseModel):
    id: int
    nombre: str
    estado_operativo: str
    color: str

    model_config = {"from_attributes": True}


class EquipoEtiquetaCreate(BaseModel):
    etiqueta_id: int


class EquipoEtiquetaOut(BaseModel):
    id: int
    equipo_id: int
    etiqueta: EtiquetaOut
    usuario_id: int
    usuario_nombre: str
    created_at: str
