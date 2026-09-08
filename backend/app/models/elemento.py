from datetime import UTC, datetime

from pydantic import BaseModel
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Elemento(Base):
    __tablename__ = "elementos"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"))
    nombre: Mapped[str] = mapped_column(String(200))
    referencia: Mapped[str] = mapped_column(String(100))
    observaciones: Mapped[str | None] = mapped_column(String(500), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class ElementoCreate(BaseModel):
    nombre: str
    referencia: str
    observaciones: str | None = None


class ElementoUpdate(BaseModel):
    nombre: str | None = None
    referencia: str | None = None
    observaciones: str | None = None


class ElementoOut(BaseModel):
    id: int
    equipo_id: int
    nombre: str
    referencia: str
    observaciones: str | None

    model_config = {"from_attributes": True}
