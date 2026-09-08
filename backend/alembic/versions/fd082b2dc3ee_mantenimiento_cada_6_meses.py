"""mantenimiento cada 6 meses

Revision ID: fd082b2dc3ee
Revises: 9f0decf73391
Create Date: 2026-09-08 09:52:10.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fd082b2dc3ee"
down_revision: str | Sequence[str] | None = "9f0decf73391"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

tipos_tarea_table = sa.table(
    "tipos_tarea",
    sa.column("categoria", sa.String),
    sa.column("periodicidad_dias", sa.Integer),
)


def upgrade() -> None:
    """Las 4 tareas de categoría "mantenimiento" (F_GASOIL, HIDRAULICO, F_AIRE,
    F_SECANTE) deben cumplirse cada 6 meses, no cada 30 días como el resto del
    catálogo sembrado inicialmente — las de "engrase" sí son mensuales."""
    op.execute(
        tipos_tarea_table.update()
        .where(tipos_tarea_table.c.categoria == "mantenimiento")
        .values(periodicidad_dias=180)
    )


def downgrade() -> None:
    op.execute(
        tipos_tarea_table.update()
        .where(tipos_tarea_table.c.categoria == "mantenimiento")
        .values(periodicidad_dias=30)
    )
