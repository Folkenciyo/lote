"""seed tipos_tarea catalogo

Revision ID: b58005934d42
Revises: 9213946cb08c
Create Date: 2026-09-07 06:07:23.714143

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from app.models.tipo_tarea import CATALOGO_TAREAS

# revision identifiers, used by Alembic.
revision: str = "b58005934d42"
down_revision: str | Sequence[str] | None = "9213946cb08c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

tipos_tarea_table = sa.table(
    "tipos_tarea",
    sa.column("nombre", sa.String),
    sa.column("categoria", sa.String),
    sa.column("periodicidad_dias", sa.Integer),
)


def upgrade() -> None:
    op.bulk_insert(
        tipos_tarea_table,
        [
            {"nombre": nombre, "categoria": categoria, "periodicidad_dias": 30}
            for nombre, categoria in CATALOGO_TAREAS
        ],
    )


def downgrade() -> None:
    nombres = [nombre for nombre, _ in CATALOGO_TAREAS]
    op.execute(
        tipos_tarea_table.delete().where(tipos_tarea_table.c.nombre.in_(nombres))
    )
