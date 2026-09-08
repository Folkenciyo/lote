from datetime import UTC, datetime

from pydantic import BaseModel
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

ESTADOS_OPERATIVOS = ("activo", "taller", "baja", "averiado")


class Equipo(Base):
    __tablename__ = "equipos"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    marca: Mapped[str | None] = mapped_column(String(100), default=None)
    modelo: Mapped[str | None] = mapped_column(String(100), default=None)
    tipo: Mapped[str | None] = mapped_column(String(100), default=None)
    observaciones: Mapped[str | None] = mapped_column(String(500), default=None)
    estado_operativo: Mapped[str] = mapped_column(String(20), default="activo")
    lectura_actual_horas: Mapped[int | None] = mapped_column(Integer, default=None)
    lectura_actual_km: Mapped[int | None] = mapped_column(Integer, default=None)
    creado_por_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class CambioEstadoEquipo(Base):
    __tablename__ = "cambios_estado_equipo"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"))
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    estado_anterior: Mapped[str] = mapped_column(String(20))
    estado_nuevo: Mapped[str] = mapped_column(String(20))
    motivo: Mapped[str | None] = mapped_column(String(500), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class EquipoCreate(BaseModel):
    codigo: str
    marca: str | None = None
    modelo: str | None = None
    tipo: str | None = None
    observaciones: str | None = None


class EquipoUpdate(BaseModel):
    activo: bool | None = None
    marca: str | None = None
    modelo: str | None = None
    tipo: str | None = None
    observaciones: str | None = None


class EquipoOut(BaseModel):
    id: int
    codigo: str
    activo: bool
    marca: str | None
    modelo: str | None
    tipo: str | None
    observaciones: str | None
    estado_operativo: str
    lectura_actual_horas: int | None
    lectura_actual_km: int | None
    creado_por_id: int | None
    creado_por_nombre: str | None = None

    model_config = {"from_attributes": True}


class LecturaEquipoUpdate(BaseModel):
    lectura_actual_horas: int | None = None
    lectura_actual_km: int | None = None


class CambioEstadoEquipoCreate(BaseModel):
    estado_nuevo: str
    motivo: str | None = None


class CambioEstadoEquipoOut(BaseModel):
    id: int
    equipo_id: int
    usuario_id: int
    usuario_nombre: str
    estado_anterior: str
    estado_nuevo: str
    motivo: str | None
    created_at: str

    model_config = {"from_attributes": True}
