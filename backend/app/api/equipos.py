import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_autenticado, require_supervisor
from app.models.equipo import (
    ESTADOS_OPERATIVOS,
    CambioEstadoEquipo,
    CambioEstadoEquipoCreate,
    CambioEstadoEquipoOut,
    Equipo,
    EquipoCreate,
    EquipoOut,
    EquipoUpdate,
    LecturaEquipoUpdate,
)
from app.models.etiqueta import (
    EquipoEtiqueta,
    EquipoEtiquetaCreate,
    EquipoEtiquetaOut,
    Etiqueta,
    EtiquetaOut,
)
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/equipos", tags=["equipos"])


def _a_equipo_out(equipo: Equipo, creado_por_nombre: str | None) -> EquipoOut:
    return EquipoOut(
        id=equipo.id,
        codigo=equipo.codigo,
        activo=equipo.activo,
        marca=equipo.marca,
        modelo=equipo.modelo,
        tipo=equipo.tipo,
        observaciones=equipo.observaciones,
        estado_operativo=equipo.estado_operativo,
        lectura_actual_horas=equipo.lectura_actual_horas,
        lectura_actual_km=equipo.lectura_actual_km,
        creado_por_id=equipo.creado_por_id,
        creado_por_nombre=creado_por_nombre,
    )


@router.get(
    "", response_model=list[EquipoOut], dependencies=[Depends(require_autenticado)]
)
def listar_equipos(
    codigo: str | None = None,
    codigos: str | None = None,
    db: Session = Depends(get_db),
) -> list[EquipoOut]:
    """`codigos`: varios códigos separados por guion y/o coma (ej.
    "1045-119-4509" o "1045, 119, 4509"), coincidencia parcial (ILIKE) por
    cada uno, unidos por OR."""
    query = db.query(Equipo, Usuario.nombre).outerjoin(
        Usuario, Equipo.creado_por_id == Usuario.id
    )
    if codigo:
        query = query.filter(Equipo.codigo.ilike(f"%{codigo}%"))
    if codigos:
        partes = [
            parte.strip() for parte in re.split(r"[,-]+", codigos) if parte.strip()
        ]
        if partes:
            query = query.filter(
                or_(*[Equipo.codigo.ilike(f"%{parte}%") for parte in partes])
            )
    filas = query.order_by(Equipo.codigo).all()
    return [_a_equipo_out(equipo, nombre) for equipo, nombre in filas]


@router.post(
    "",
    response_model=EquipoOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_equipo(
    payload: EquipoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_supervisor),
) -> EquipoOut:
    if db.query(Equipo).filter(Equipo.codigo == payload.codigo).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un equipo con código {payload.codigo}",
        )
    equipo = Equipo(**payload.model_dump(), creado_por_id=usuario.id)
    db.add(equipo)
    db.commit()
    db.refresh(equipo)
    return _a_equipo_out(equipo, usuario.nombre)


@router.get(
    "/{equipo_id}",
    response_model=EquipoOut,
    dependencies=[Depends(require_autenticado)],
)
def obtener_equipo(equipo_id: int, db: Session = Depends(get_db)) -> EquipoOut:
    fila = (
        db.query(Equipo, Usuario.nombre)
        .outerjoin(Usuario, Equipo.creado_por_id == Usuario.id)
        .filter(Equipo.id == equipo_id)
        .first()
    )
    if fila is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    equipo, nombre = fila
    return _a_equipo_out(equipo, nombre)


@router.patch(
    "/{equipo_id}",
    response_model=EquipoOut,
    dependencies=[Depends(require_supervisor)],
)
def actualizar_equipo(
    equipo_id: int, payload: EquipoUpdate, db: Session = Depends(get_db)
) -> EquipoOut:
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(equipo, field, value)
    db.commit()
    db.refresh(equipo)
    creador = db.get(Usuario, equipo.creado_por_id) if equipo.creado_por_id else None
    return _a_equipo_out(equipo, creador.nombre if creador else None)


@router.delete(
    "/{equipo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_supervisor)],
)
def desactivar_equipo(equipo_id: int, db: Session = Depends(get_db)) -> None:
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    equipo.activo = False
    db.commit()


@router.patch(
    "/{equipo_id}/lectura",
    response_model=EquipoOut,
    dependencies=[Depends(require_autenticado)],
)
def actualizar_lectura_equipo(
    equipo_id: int, payload: LecturaEquipoUpdate, db: Session = Depends(get_db)
) -> EquipoOut:
    """Lectura actual de horas/km del vehículo — a diferencia del resto de
    datos del equipo, cualquier usuario autenticado puede actualizarla (la
    apunta quien esté delante del vehículo, técnico incluido)."""
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(equipo, field, value)
    db.commit()
    db.refresh(equipo)
    creador = db.get(Usuario, equipo.creado_por_id) if equipo.creado_por_id else None
    return _a_equipo_out(equipo, creador.nombre if creador else None)


@router.post(
    "/{equipo_id}/estado",
    response_model=EquipoOut,
    dependencies=[Depends(require_supervisor)],
)
def cambiar_estado_equipo(
    equipo_id: int,
    payload: CambioEstadoEquipoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_supervisor),
) -> EquipoOut:
    if payload.estado_nuevo not in ESTADOS_OPERATIVOS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Estado inválido, debe ser uno de: {ESTADOS_OPERATIVOS}",
        )
    equipo = db.get(Equipo, equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    estado_anterior = equipo.estado_operativo
    if estado_anterior != payload.estado_nuevo:
        db.add(
            CambioEstadoEquipo(
                equipo_id=equipo_id,
                usuario_id=usuario.id,
                estado_anterior=estado_anterior,
                estado_nuevo=payload.estado_nuevo,
                motivo=payload.motivo,
            )
        )
        equipo.estado_operativo = payload.estado_nuevo
        db.commit()
        db.refresh(equipo)
    creador = db.get(Usuario, equipo.creado_por_id) if equipo.creado_por_id else None
    return _a_equipo_out(equipo, creador.nombre if creador else None)


@router.get(
    "/{equipo_id}/cambios-estado",
    response_model=list[CambioEstadoEquipoOut],
    dependencies=[Depends(require_autenticado)],
)
def listar_cambios_estado(
    equipo_id: int, db: Session = Depends(get_db)
) -> list[CambioEstadoEquipoOut]:
    if db.get(Equipo, equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    filas = (
        db.query(CambioEstadoEquipo, Usuario.nombre)
        .join(Usuario, CambioEstadoEquipo.usuario_id == Usuario.id)
        .filter(CambioEstadoEquipo.equipo_id == equipo_id)
        .order_by(CambioEstadoEquipo.created_at.desc(), CambioEstadoEquipo.id.desc())
        .all()
    )
    return [
        CambioEstadoEquipoOut(
            id=cambio.id,
            equipo_id=cambio.equipo_id,
            usuario_id=cambio.usuario_id,
            usuario_nombre=nombre,
            estado_anterior=cambio.estado_anterior,
            estado_nuevo=cambio.estado_nuevo,
            motivo=cambio.motivo,
            created_at=cambio.created_at.isoformat(),
        )
        for cambio, nombre in filas
    ]


@router.get(
    "/{equipo_id}/etiquetas",
    response_model=list[EquipoEtiquetaOut],
    dependencies=[Depends(require_autenticado)],
)
def listar_etiquetas_equipo(
    equipo_id: int, db: Session = Depends(get_db)
) -> list[EquipoEtiquetaOut]:
    if db.get(Equipo, equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    filas = (
        db.query(EquipoEtiqueta, Etiqueta, Usuario.nombre)
        .join(Etiqueta, EquipoEtiqueta.etiqueta_id == Etiqueta.id)
        .join(Usuario, EquipoEtiqueta.usuario_id == Usuario.id)
        .filter(EquipoEtiqueta.equipo_id == equipo_id)
        .order_by(EquipoEtiqueta.created_at.desc())
        .all()
    )
    return [
        EquipoEtiquetaOut(
            id=asignacion.id,
            equipo_id=asignacion.equipo_id,
            etiqueta=EtiquetaOut.model_validate(etiqueta),
            usuario_id=asignacion.usuario_id,
            usuario_nombre=nombre,
            created_at=asignacion.created_at.isoformat(),
        )
        for asignacion, etiqueta, nombre in filas
    ]


@router.post(
    "/{equipo_id}/etiquetas",
    response_model=EquipoEtiquetaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_supervisor)],
)
def asignar_etiqueta_equipo(
    equipo_id: int,
    payload: EquipoEtiquetaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_supervisor),
) -> EquipoEtiquetaOut:
    if db.get(Equipo, equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado"
        )
    etiqueta = db.get(Etiqueta, payload.etiqueta_id)
    if etiqueta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Etiqueta no encontrada"
        )
    ya_asignada = (
        db.query(EquipoEtiqueta)
        .filter(
            EquipoEtiqueta.equipo_id == equipo_id,
            EquipoEtiqueta.etiqueta_id == payload.etiqueta_id,
        )
        .first()
    )
    if ya_asignada:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El equipo ya tiene esa etiqueta asignada",
        )
    asignacion = EquipoEtiqueta(
        equipo_id=equipo_id, etiqueta_id=payload.etiqueta_id, usuario_id=usuario.id
    )
    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)
    return EquipoEtiquetaOut(
        id=asignacion.id,
        equipo_id=asignacion.equipo_id,
        etiqueta=EtiquetaOut.model_validate(etiqueta),
        usuario_id=asignacion.usuario_id,
        usuario_nombre=usuario.nombre,
        created_at=asignacion.created_at.isoformat(),
    )


@router.delete(
    "/{equipo_id}/etiquetas/{etiqueta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_supervisor)],
)
def quitar_etiqueta_equipo(
    equipo_id: int, etiqueta_id: int, db: Session = Depends(get_db)
) -> None:
    asignacion = (
        db.query(EquipoEtiqueta)
        .filter(
            EquipoEtiqueta.equipo_id == equipo_id,
            EquipoEtiqueta.etiqueta_id == etiqueta_id,
        )
        .first()
    )
    if asignacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El equipo no tiene esa etiqueta asignada",
        )
    db.delete(asignacion)
    db.commit()
