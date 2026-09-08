"""Genera datos de demostración para desarrollo local: más usuarios técnicos
y un mes de actividad simulada (registros, cambios de estado, etiquetas)
para que la app se vea "viva" en vez de casi vacía.

Es un script manual de un solo uso para entornos de desarrollo — NO se
ejecuta desde el entrypoint de producción ni desde ningún otro sitio
automático. Idempotente en usuarios/etiquetas (no duplica por email/nombre),
pero cada ejecución añade registros nuevos.
"""

import random
from datetime import UTC, date, datetime, timedelta

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.equipo import CambioEstadoEquipo, Equipo
from app.models.etiqueta import EquipoEtiqueta, Etiqueta
from app.models.registro import Registro
from app.models.tipo_tarea import TipoTarea
from app.models.usuario import Usuario

TECNICOS = [
    ("miguel@flota.com", "Miguel Sánchez"),
    ("laura@flota.com", "Laura Torres"),
    ("antonio@flota.com", "Antonio Gómez"),
    ("elena@flota.com", "Elena Ruiz"),
    ("david@flota.com", "David Martín"),
    ("carmen@flota.com", "Carmen Díaz"),
    ("javier@flota.com", "Javier Moreno"),
]

ETIQUETAS_DEMO = [
    ("Fuga de aceite", "taller", "yellow"),
    ("Frenos gastados", "taller", "red"),
    ("Revisión eléctrica", "taller", "blue"),
    ("Batería agotada", "averiado", "red"),
    ("Motor de arranque", "averiado", "purple"),
    ("Pendiente ITV", "baja", "gray"),
    ("Cedido a otra obra", "baja", "purple"),
]

OBSERVACIONES_POR_TAREA = {
    "ACEITE": [
        "Cambio de aceite y filtro",
        "Nivel correcto, se rellena",
        "Aceite sucio, cambiado",
    ],
    "CAJA_C": [
        "Revisión caja de cambios",
        "Nivel de aceite de caja correcto",
        "Cambio de aceite de caja",
    ],
    "ENGRASE": [
        "Engrase general",
        "Engrase de puntos de articulación",
        "Engrase completo",
    ],
    "GRUPO": ["Revisión de grupo", "Engrase de grupo", "Nivel correcto"],
    "F_GASOIL": [
        "Cambio de filtro de gasoil",
        "Filtro sustituido",
        "Revisión del sistema de combustible",
    ],
    "HIDRAULICO": [
        "Cambio de filtro hidráulico",
        "Nivel de aceite hidráulico correcto",
        "Revisión del circuito hidráulico",
    ],
    "F_AIRE": [
        "Cambio de filtro de aire",
        "Filtro limpiado",
        "Filtro sustituido por desgaste",
    ],
    "F_SECANTE": [
        "Cambio de filtro secante",
        "Purga de aire, filtro revisado",
        "Filtro sustituido",
    ],
}

DIAS_ATRAS_POSIBLES = [
    1,
    2,
    2,
    3,
    3,
    4,
    5,
    6,
    7,
    8,
    10,
    12,
    15,
    18,
    20,
    22,
    25,
    28,
    32,
    35,
    40,
    45,
    50,
    60,
]

MOTIVOS_TALLER = [
    "Revisión de frenos",
    "Ruido anómalo en el motor",
    "Cambio de neumáticos",
    "Fuga detectada en revisión",
    "Revisión eléctrica programada",
]
MOTIVOS_AVERIADO = [
    "No arranca",
    "Avería hidráulica",
    "Rotura de correa",
    "Fallo de motor",
]
MOTIVOS_BAJA = [
    "Pendiente de baja definitiva",
    "Cedido a otra obra",
    "En espera de ITV",
]


def run(hoy: date = date(2026, 9, 8)) -> None:
    random.seed(42)
    db = SessionLocal()
    try:
        emails_existentes = {u.email for u in db.query(Usuario).all()}
        for email, nombre in TECNICOS:
            if email in emails_existentes:
                continue
            db.add(
                Usuario(
                    email=email,
                    password_hash=hash_password("tecnico123"),
                    nombre=nombre,
                    rol="tecnico",
                )
            )
        db.commit()

        nombres_etiqueta_existentes = {e.nombre for e in db.query(Etiqueta).all()}
        for nombre, estado, color in ETIQUETAS_DEMO:
            if nombre in nombres_etiqueta_existentes:
                continue
            db.add(Etiqueta(nombre=nombre, estado_operativo=estado, color=color))
        db.commit()

        tecnicos = db.query(Usuario).filter(Usuario.rol == "tecnico").all()
        supervisores = db.query(Usuario).filter(Usuario.rol == "supervisor").all()
        etiquetas = db.query(Etiqueta).all()
        tareas = db.query(TipoTarea).all()
        equipos = db.query(Equipo).filter(Equipo.activo.is_(True)).all()

        muestra_equipos = random.sample(equipos, k=min(220, len(equipos)))

        registros_creados = 0
        for equipo in muestra_equipos:
            tareas_elegidas = random.sample(tareas, k=random.randint(2, len(tareas)))
            for tarea in tareas_elegidas:
                fecha = hoy - timedelta(days=random.choice(DIAS_ATRAS_POSIBLES))
                usuario = random.choice(tecnicos)
                observaciones = random.choice(
                    OBSERVACIONES_POR_TAREA.get(tarea.nombre, ["Tarea realizada"])
                )
                db.add(
                    Registro(
                        equipo_id=equipo.id,
                        tipo_tarea_id=tarea.id,
                        usuario_id=usuario.id,
                        fecha_realizada=fecha,
                        observaciones=observaciones,
                        horas_trabajo=random.choice(
                            [None, None, random.randint(50, 3000)]
                        ),
                        kilometros=random.choice(
                            [None, None, random.randint(1000, 90000)]
                        ),
                        created_at=datetime.combine(
                            fecha, datetime.min.time(), tzinfo=UTC
                        ),
                    )
                )
                registros_creados += 1
        db.commit()

        for equipo in muestra_equipos:
            if equipo.lectura_actual_horas is None and random.random() < 0.4:
                equipo.lectura_actual_horas = random.randint(200, 5000)
            if equipo.lectura_actual_km is None and random.random() < 0.4:
                equipo.lectura_actual_km = random.randint(5000, 150000)
        db.commit()

        equipos_con_problema = random.sample(muestra_equipos, k=15)
        for equipo in equipos_con_problema:
            estado_nuevo = random.choice(["taller", "taller", "averiado", "baja"])
            motivo = random.choice(
                {
                    "taller": MOTIVOS_TALLER,
                    "averiado": MOTIVOS_AVERIADO,
                    "baja": MOTIVOS_BAJA,
                }[estado_nuevo]
            )
            supervisor = random.choice(supervisores)
            estado_anterior = equipo.estado_operativo
            if estado_anterior == estado_nuevo:
                continue
            db.add(
                CambioEstadoEquipo(
                    equipo_id=equipo.id,
                    usuario_id=supervisor.id,
                    estado_anterior=estado_anterior,
                    estado_nuevo=estado_nuevo,
                    motivo=motivo,
                )
            )
            equipo.estado_operativo = estado_nuevo

            candidatas = [e for e in etiquetas if e.estado_operativo == estado_nuevo]
            if candidatas:
                for etiqueta in random.sample(
                    candidatas, k=min(len(candidatas), random.randint(1, 2))
                ):
                    ya_asignada = (
                        db.query(EquipoEtiqueta)
                        .filter(
                            EquipoEtiqueta.equipo_id == equipo.id,
                            EquipoEtiqueta.etiqueta_id == etiqueta.id,
                        )
                        .first()
                    )
                    if ya_asignada:
                        continue
                    db.add(
                        EquipoEtiqueta(
                            equipo_id=equipo.id,
                            etiqueta_id=etiqueta.id,
                            usuario_id=supervisor.id,
                        )
                    )
        db.commit()

        print(f"Técnicos creados/existentes: {len(tecnicos)}")
        print(f"Etiquetas en catálogo: {len(etiquetas)}")
        print(f"Registros nuevos: {registros_creados}")
        print(f"Equipos con estado cambiado: {len(equipos_con_problema)}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
