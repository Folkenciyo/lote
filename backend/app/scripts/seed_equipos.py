"""Parsea los 42 Excel originales (engrase N) y siembra el catálogo real de equipos.

Solo se leen los archivos "engrase N" (no "mantenimiento N"): ambos listan los
mismos códigos de equipo por lote, así que basta con una de las dos series.
"""

import re
from pathlib import Path
from typing import NamedTuple

import openpyxl
from sqlalchemy.orm import Session

from app.models.equipo import Equipo

LOTE_PATTERN = re.compile(r"(?i)engrase\s*(\d+)")


class EquipoSeed(NamedTuple):
    codigo: str
    lote: int


def extract_lote_from_filename(filename: str) -> int:
    match = LOTE_PATTERN.search(filename)
    if not match:
        raise ValueError(
            f"No se pudo determinar el lote desde el nombre de archivo: {filename}"
        )
    return int(match.group(1))


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


def parse_seed_directory(directory: Path) -> tuple[list[EquipoSeed], list[str]]:
    """Devuelve (equipos únicos, códigos duplicados detectados entre archivos)."""
    lote_por_codigo: dict[str, int] = {}
    duplicados: list[str] = []

    for path in find_engrase_files(directory):
        lote = extract_lote_from_filename(path.name)
        for codigo in extract_codigos_from_excel(path):
            if codigo in lote_por_codigo:
                duplicados.append(codigo)
                continue
            lote_por_codigo[codigo] = lote

    equipos = [
        EquipoSeed(codigo=codigo, lote=lote) for codigo, lote in lote_por_codigo.items()
    ]
    return equipos, duplicados


def seed_equipos_desde_excel(db: Session, directory: Path) -> int:
    equipos, _ = parse_seed_directory(directory)
    codigos_existentes = {codigo for (codigo,) in db.query(Equipo.codigo).all()}

    nuevos = [e for e in equipos if e.codigo not in codigos_existentes]
    db.add_all(Equipo(codigo=e.codigo, lote=e.lote) for e in nuevos)
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
