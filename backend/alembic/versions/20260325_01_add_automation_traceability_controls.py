"""add automation traceability controls

Revision ID: 20260325_01
Revises: 20260324_01
Create Date: 2026-03-25 15:20:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260325_01"
down_revision = "20260324_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "automation_settings",
        sa.Column("tone", sa.String(length=32), nullable=False, server_default="trung_tinh"),
    )
    op.add_column(
        "automation_settings",
        sa.Column("focus_prompt", sa.String(length=280), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("automation_settings", "focus_prompt")
    op.drop_column("automation_settings", "tone")
