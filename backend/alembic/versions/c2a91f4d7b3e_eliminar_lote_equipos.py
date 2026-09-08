"""eliminar lote de equipos

Revision ID: c2a91f4d7b3e
Revises: 06fc9d98e49a
Create Date: 2026-09-08 14:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c2a91f4d7b3e"
down_revision: str | Sequence[str] | None = "06fc9d98e49a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_column("equipos", "lote")


def downgrade() -> None:
    op.add_column(
        "equipos", sa.Column("lote", sa.Integer(), nullable=False, server_default="1")
    )
