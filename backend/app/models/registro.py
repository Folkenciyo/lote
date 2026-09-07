from datetime import UTC, date, datetime

from pydantic import BaseModel
from sqlalchemy import Date, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Registro(Base):
    __tablename__ = "registros"
    __table_args__ = (
        Index(
            "ix_registros_equipo_tarea_fecha",
            "equipo_id",
            "tipo_tarea_id",
            "fecha_realizada",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"))
    tipo_tarea_id: Mapped[int] = mapped_column(ForeignKey("tipos_tarea.id"))
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    fecha_realizada: Mapped[date] = mapped_column(Date)
    observaciones: Mapped[str | None] = mapped_column(String(500), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class RegistroCreate(BaseModel):
    equipo_id: int
    tipo_tarea_id: int
    fecha_realizada: date
    observaciones: str | None = None


class RegistroOut(BaseModel):
    id: int
    equipo_id: int
    tipo_tarea_id: int
    tipo_tarea_nombre: str
    usuario_id: int
    usuario_nombre: str
    fecha_realizada: date
    observaciones: str | None

    model_config = {"from_attributes": True}
