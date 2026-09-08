"""lectura actual equipo

Revision ID: bfdfcba3e0c3
Revises: 3d8d1b1ec609
Create Date: 2026-09-08 11:16:29.475580

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "bfdfcba3e0c3"
down_revision: str | Sequence[str] | None = "3d8d1b1ec609"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "equipos", sa.Column("lectura_actual_horas", sa.Integer(), nullable=True)
    )
    op.add_column(
        "equipos", sa.Column("lectura_actual_km", sa.Integer(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("equipos", "lectura_actual_km")
    op.drop_column("equipos", "lectura_actual_horas")
