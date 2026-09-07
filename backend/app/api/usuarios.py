from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_supervisor
from app.core.security import hash_password
from app.models.usuario import (
    ROLES,
    Usuario,
    UsuarioCreate,
    UsuarioOut,
    UsuarioUpdate,
    normalizar_email,
)

router = APIRouter(
    prefix="/api/usuarios",
    tags=["usuarios"],
    dependencies=[Depends(require_supervisor)],
)


@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)) -> list[Usuario]:
    return db.query(Usuario).order_by(Usuario.nombre).all()


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)) -> Usuario:
    if payload.rol not in ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Rol inválido, debe ser uno de: {ROLES}",
        )
    email = normalizar_email(payload.email)
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un usuario con email {email}",
        )

    usuario = Usuario(
        email=email,
        password_hash=hash_password(payload.password),
        nombre=payload.nombre,
        rol=payload.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int, payload: UsuarioUpdate, db: Session = Depends(get_db)
) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )

    datos = payload.model_dump(exclude_unset=True)
    if "rol" in datos and datos["rol"] not in ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Rol inválido, debe ser uno de: {ROLES}",
        )
    if "password" in datos:
        usuario.password_hash = hash_password(datos.pop("password"))
    for field, value in datos.items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_usuario(usuario_id: int, db: Session = Depends(get_db)) -> None:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )
    usuario.activo = False
    db.commit()
