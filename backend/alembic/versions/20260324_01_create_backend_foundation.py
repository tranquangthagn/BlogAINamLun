"""create backend foundation tables

Revision ID: 20260324_01
Revises:
Create Date: 2026-03-24 15:55:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260324_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("author", sa.String(length=120), nullable=False),
        sa.Column("avatar", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("likes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("source_type", sa.String(length=32), nullable=False),
    )
    op.create_index("ix_posts_category", "posts", ["category"])
    op.create_index("ix_posts_created_at", "posts", ["created_at"])
    op.create_index("ix_posts_source_type", "posts", ["source_type"])

    op.create_table(
        "automation_settings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("schedule_mode", sa.String(length=32), nullable=False),
        sa.Column("post_time", sa.String(length=5), nullable=False, server_default="08:00"),
        sa.Column("interval_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("sources", sa.JSON(), nullable=False),
        sa.Column("trend_range_mode", sa.String(length=32), nullable=False),
        sa.Column("custom_start", sa.Date(), nullable=True),
        sa.Column("custom_end", sa.Date(), nullable=True),
        sa.Column("last_run_at", sa.DateTime(), nullable=True),
        sa.Column("last_generated_post_id", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "post_images",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_post_images_post_id", "post_images", ["post_id"])
    op.create_unique_constraint("uq_post_images_post_position", "post_images", ["post_id", "position"])

    op.create_table(
        "user_post_states",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("saved", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("saved_at", sa.DateTime(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("read_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_user_post_states_post_id", "user_post_states", ["post_id"])
    op.create_unique_constraint("uq_user_post_states_post_id", "user_post_states", ["post_id"])

    op.create_table(
        "automation_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("topic_key", sa.String(length=64), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("posted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("published_post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_automation_history_source", "automation_history", ["source"])
    op.create_index("ix_automation_history_topic_key", "automation_history", ["topic_key"])
    op.create_index("ix_automation_history_category", "automation_history", ["category"])
    op.create_index("ix_automation_history_created_at", "automation_history", ["created_at"])
    op.create_index("ix_automation_history_published_post_id", "automation_history", ["published_post_id"])


def downgrade() -> None:
    op.drop_index("ix_automation_history_published_post_id", table_name="automation_history")
    op.drop_index("ix_automation_history_created_at", table_name="automation_history")
    op.drop_index("ix_automation_history_category", table_name="automation_history")
    op.drop_index("ix_automation_history_topic_key", table_name="automation_history")
    op.drop_index("ix_automation_history_source", table_name="automation_history")
    op.drop_table("automation_history")

    op.drop_constraint("uq_user_post_states_post_id", "user_post_states", type_="unique")
    op.drop_index("ix_user_post_states_post_id", table_name="user_post_states")
    op.drop_table("user_post_states")

    op.drop_constraint("uq_post_images_post_position", "post_images", type_="unique")
    op.drop_index("ix_post_images_post_id", table_name="post_images")
    op.drop_table("post_images")

    op.drop_table("automation_settings")

    op.drop_index("ix_posts_source_type", table_name="posts")
    op.drop_index("ix_posts_created_at", table_name="posts")
    op.drop_index("ix_posts_category", table_name="posts")
    op.drop_table("posts")
