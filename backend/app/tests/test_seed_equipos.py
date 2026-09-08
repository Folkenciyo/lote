import openpyxl

from app.scripts.seed_equipos import (
    extract_codigos_from_excel,
    parse_seed_directory,
    seed_equipos_desde_excel,
)


def _crear_excel(path, codigos):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append([None, "ACEITE", "CAJA C", "ENGRASE", "GRUPO"])
    ws.append([None, "ENERO", None, None, None])
    for codigo in codigos:
        ws.append([codigo])
    wb.save(path)


def test_extract_codigos_from_excel(tmp_path):
    path = tmp_path / "engrase 1 [1002-1004].xlsx"
    _crear_excel(path, [1002, 1003, 1004])
    assert extract_codigos_from_excel(path) == ["1002", "1003", "1004"]


def test_parse_seed_directory_une_codigos_y_detecta_duplicados(tmp_path):
    _crear_excel(tmp_path / "engrase 1 [1002-1003].xlsx", [1002, 1003])
    _crear_excel(tmp_path / "engrase 2 [1003-1004].xlsx", [1003, 1004])

    codigos, duplicados = parse_seed_directory(tmp_path)

    assert codigos == ["1002", "1003", "1004"]
    assert duplicados == ["1003"]


def test_seed_equipos_desde_excel_es_idempotente(tmp_path, db_session):
    _crear_excel(tmp_path / "engrase 1 [1002-1003].xlsx", [1002, 1003])

    insertados_primera_vez = seed_equipos_desde_excel(db_session, tmp_path)
    insertados_segunda_vez = seed_equipos_desde_excel(db_session, tmp_path)

    assert insertados_primera_vez == 2
    assert insertados_segunda_vez == 0
