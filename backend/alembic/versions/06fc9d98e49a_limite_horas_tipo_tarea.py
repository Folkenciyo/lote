"""limite horas tipo tarea

Revision ID: 06fc9d98e49a
Revises: bfdfcba3e0c3
Create Date: 2026-09-08 11:16:30.820090

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "06fc9d98e49a"
down_revision: str | Sequence[str] | None = "bfdfcba3e0c3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("tipos_tarea", sa.Column("limite_horas", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("tipos_tarea", "limite_horas")
