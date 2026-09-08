"""horas y kilometros en registro

Revision ID: 3d8d1b1ec609
Revises: aabdc6e0553b
Create Date: 2026-09-08 10:55:44.543959

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3d8d1b1ec609"
down_revision: str | Sequence[str] | None = "aabdc6e0553b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("registros", sa.Column("horas_trabajo", sa.Integer(), nullable=True))
    op.add_column("registros", sa.Column("kilometros", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("registros", "kilometros")
    op.drop_column("registros", "horas_trabajo")
