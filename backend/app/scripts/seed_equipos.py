"""Parsea los 42 Excel originales (engrase N) y siembra el catálogo real de equipos.

Solo se leen los archivos "engrase N" (no "mantenimiento N"): ambos listan los
mismos códigos de equipo, así que basta con una de las dos series.
"""

from pathlib import Path

import openpyxl
from sqlalchemy.orm import Session

from app.models.equipo import Equipo


def extract_codigos_from_excel(path: Path) -> list[str]:
    workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
    sheet = workbook.worksheets[0]
    codigos = []
    for row in sheet.iter_rows(min_row=3, values_only=True):
        codigo = row[0]
        if codigo is not None:
            codigos.append(str(codigo))
    return codigos


def find_engrase_files(directory: Path) -> list[Path]:
    return sorted(
        p
        for p in directory.iterdir()
        if p.suffix.lower() == ".xlsx" and "engrase" in p.name.lower()
    )


def parse_seed_directory(directory: Path) -> tuple[list[str], list[str]]:
    """Devuelve (códigos únicos, códigos duplicados detectados entre archivos)."""
    vistos: set[str] = set()
    duplicados: list[str] = []
    codigos: list[str] = []

    for path in find_engrase_files(directory):
        for codigo in extract_codigos_from_excel(path):
            if codigo in vistos:
                duplicados.append(codigo)
                continue
            vistos.add(codigo)
            codigos.append(codigo)

    return codigos, duplicados


def seed_equipos_desde_excel(db: Session, directory: Path) -> int:
    codigos, _ = parse_seed_directory(directory)
    codigos_existentes = {codigo for (codigo,) in db.query(Equipo.codigo).all()}

    nuevos = [c for c in codigos if c not in codigos_existentes]
    db.add_all(Equipo(codigo=c) for c in nuevos)
    db.commit()
    return len(nuevos)


if __name__ == "__main__":
    from app.core.database import SessionLocal

    seed_dir = Path(__file__).resolve().parents[2] / "seed_data"
    session = SessionLocal()
    try:
        total = seed_equipos_desde_excel(session, seed_dir)
        print(f"Equipos insertados: {total}")
    finally:
        session.close()
