from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserPostState(Base):
    __tablename__ = "user_post_states"
    __table_args__ = (UniqueConstraint("post_id", name="uq_user_post_states_post_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    saved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    saved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    post = relationship("Post", back_populates="user_state")
