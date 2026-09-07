import openpyxl
import pytest

from app.scripts.seed_equipos import (
    extract_codigos_from_excel,
    extract_lote_from_filename,
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


@pytest.mark.parametrize(
    "filename,lote_esperado",
    [
        ("engrase 1 [1002-1310].xlsx", 1),
        ("ENGRASE 13[6388-6704].xlsx", 13),
        ("ENGRASE 21[9885-9982].xlsx", 21),
    ],
)
def test_extract_lote_from_filename(filename, lote_esperado):
    assert extract_lote_from_filename(filename) == lote_esperado


def test_extract_lote_from_filename_sin_match_lanza_error():
    with pytest.raises(ValueError):
        extract_lote_from_filename("mantenimiento 1 [1002-1310].xlsx")


def test_extract_codigos_from_excel(tmp_path):
    path = tmp_path / "engrase 1 [1002-1004].xlsx"
    _crear_excel(path, [1002, 1003, 1004])
    assert extract_codigos_from_excel(path) == ["1002", "1003", "1004"]


def test_parse_seed_directory_asigna_lote_correcto_y_detecta_duplicados(tmp_path):
    _crear_excel(tmp_path / "engrase 1 [1002-1003].xlsx", [1002, 1003])
    _crear_excel(tmp_path / "engrase 2 [1003-1004].xlsx", [1003, 1004])

    equipos, duplicados = parse_seed_directory(tmp_path)

    por_codigo = {e.codigo: e.lote for e in equipos}
    assert por_codigo == {"1002": 1, "1003": 1, "1004": 2}
    assert duplicados == ["1003"]


def test_seed_equipos_desde_excel_es_idempotente(tmp_path, db_session):
    _crear_excel(tmp_path / "engrase 1 [1002-1003].xlsx", [1002, 1003])

    insertados_primera_vez = seed_equipos_desde_excel(db_session, tmp_path)
    insertados_segunda_vez = seed_equipos_desde_excel(db_session, tmp_path)

    assert insertados_primera_vez == 2
    assert insertados_segunda_vez == 0
