"""tabla elementos

Revision ID: efba549f42b9
Revises: fd082b2dc3ee
Create Date: 2026-09-08 11:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "efba549f42b9"
down_revision: str | Sequence[str] | None = "fd082b2dc3ee"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "elementos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("equipo_id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=200), nullable=False),
        sa.Column("referencia", sa.String(length=100), nullable=False),
        sa.Column("observaciones", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["equipo_id"], ["equipos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_elementos_equipo_id", "elementos", ["equipo_id"])
    op.create_unique_constraint(
        "uq_elementos_equipo_referencia", "elementos", ["equipo_id", "referencia"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_elementos_equipo_referencia", "elementos", type_="unique")
    op.drop_index("ix_elementos_equipo_id", table_name="elementos")
    op.drop_table("elementos")
