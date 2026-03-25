"""add automation batch metadata

Revision ID: 20260325_02
Revises: 20260325_01
Create Date: 2026-03-25 18:35:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260325_02"
down_revision = "20260325_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("automation_history") as batch_op:
        batch_op.add_column(sa.Column("batch_id", sa.String(length=64), nullable=True))
        batch_op.add_column(
            sa.Column("status", sa.String(length=32), nullable=False, server_default="queued")
        )
        batch_op.add_column(sa.Column("failure_reason", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("image_urls_json", sa.Text(), nullable=True))
        batch_op.create_index("ix_automation_history_batch_id", ["batch_id"], unique=False)
        batch_op.create_index("ix_automation_history_status", ["status"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("automation_history") as batch_op:
        batch_op.drop_index("ix_automation_history_status")
        batch_op.drop_index("ix_automation_history_batch_id")
        batch_op.drop_column("image_urls_json")
        batch_op.drop_column("failure_reason")
        batch_op.drop_column("status")
        batch_op.drop_column("batch_id")
