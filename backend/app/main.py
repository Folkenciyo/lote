from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.elementos import router as elementos_router
from app.api.equipos import router as equipos_router
from app.api.estado import router as estado_router
from app.api.etiquetas import router as etiquetas_router
from app.api.exportaciones import router as exportaciones_router
from app.api.registros import router as registros_router
from app.api.tipos_tarea import router as tipos_tarea_router
from app.api.usuarios import router as usuarios_router
from app.core.config import settings
from app.core.database import get_db

app = FastAPI(title="Sistema de Mantenimiento de Flota")
app.include_router(auth_router)
app.include_router(equipos_router)
app.include_router(registros_router)
app.include_router(estado_router)
app.include_router(dashboard_router)
app.include_router(exportaciones_router)
app.include_router(usuarios_router)
app.include_router(tipos_tarea_router)
app.include_router(elementos_router)
app.include_router(etiquetas_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
