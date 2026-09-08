"""estado operativo equipo y cambios

Revision ID: aabdc6e0553b
Revises: efba549f42b9
Create Date: 2026-09-08 10:55:43.274721

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aabdc6e0553b"
down_revision: str | Sequence[str] | None = "efba549f42b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "equipos",
        sa.Column(
            "estado_operativo",
            sa.String(length=20),
            nullable=False,
            server_default="activo",
        ),
    )
    op.create_table(
        "cambios_estado_equipo",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("equipo_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("estado_anterior", sa.String(length=20), nullable=False),
        sa.Column("estado_nuevo", sa.String(length=20), nullable=False),
        sa.Column("motivo", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["equipo_id"], ["equipos.id"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_cambios_estado_equipo_equipo_id", "cambios_estado_equipo", ["equipo_id"]
    )


def downgrade() -> None:
    op.drop_index(
        "ix_cambios_estado_equipo_equipo_id", table_name="cambios_estado_equipo"
    )
    op.drop_table("cambios_estado_equipo")
    op.drop_column("equipos", "estado_operativo")
