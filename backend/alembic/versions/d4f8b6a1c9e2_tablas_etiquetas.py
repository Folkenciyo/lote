"""tablas etiquetas

Revision ID: d4f8b6a1c9e2
Revises: c2a91f4d7b3e
Create Date: 2026-09-08 14:05:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4f8b6a1c9e2"
down_revision: str | Sequence[str] | None = "c2a91f4d7b3e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "etiquetas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=50), nullable=False),
        sa.Column("estado_operativo", sa.String(length=20), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )
    op.create_table(
        "equipo_etiquetas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("equipo_id", sa.Integer(), nullable=False),
        sa.Column("etiqueta_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["equipo_id"], ["equipos.id"]),
        sa.ForeignKeyConstraint(["etiqueta_id"], ["etiquetas.id"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("equipo_id", "etiqueta_id", name="uq_equipo_etiqueta"),
    )
    op.create_index("ix_equipo_etiquetas_equipo_id", "equipo_etiquetas", ["equipo_id"])


def downgrade() -> None:
    op.drop_index("ix_equipo_etiquetas_equipo_id", table_name="equipo_etiquetas")
    op.drop_table("equipo_etiquetas")
    op.drop_table("etiquetas")
