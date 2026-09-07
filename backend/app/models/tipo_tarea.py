from pydantic import BaseModel
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

CATEGORIAS = ("engrase", "mantenimiento")

CATALOGO_TAREAS = (
    ("ACEITE", "engrase"),
    ("CAJA_C", "engrase"),
    ("ENGRASE", "engrase"),
    ("GRUPO", "engrase"),
    ("F_GASOIL", "mantenimiento"),
    ("HIDRAULICO", "mantenimiento"),
    ("F_AIRE", "mantenimiento"),
    ("F_SECANTE", "mantenimiento"),
)


class TipoTarea(Base):
    __tablename__ = "tipos_tarea"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    categoria: Mapped[str] = mapped_column(String(20))
    periodicidad_dias: Mapped[int] = mapped_column(Integer, default=30)


class TipoTareaUpdate(BaseModel):
    periodicidad_dias: int


class TipoTareaOut(BaseModel):
    id: int
    nombre: str
    categoria: str
    periodicidad_dias: int

    model_config = {"from_attributes": True}
