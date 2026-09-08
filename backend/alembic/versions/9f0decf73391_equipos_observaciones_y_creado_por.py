"""equipos observaciones y creado_por

Revision ID: 9f0decf73391
Revises: b58005934d42
Create Date: 2026-09-08 09:50:44.168108

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9f0decf73391"
down_revision: str | Sequence[str] | None = "b58005934d42"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "equipos", sa.Column("observaciones", sa.String(length=500), nullable=True)
    )
    op.add_column("equipos", sa.Column("creado_por_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_equipos_creado_por_id_usuarios",
        "equipos",
        "usuarios",
        ["creado_por_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_equipos_creado_por_id_usuarios", "equipos", type_="foreignkey"
    )
    op.drop_column("equipos", "creado_por_id")
    op.drop_column("equipos", "observaciones")
