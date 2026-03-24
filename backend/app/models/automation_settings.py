from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AutomationSettings(Base):
    __tablename__ = "automation_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    schedule_mode: Mapped[str] = mapped_column(String(32), nullable=False)
    post_time: Mapped[str] = mapped_column(String(5), nullable=False, default="08:00")
    interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    sources: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    trend_range_mode: Mapped[str] = mapped_column(String(32), nullable=False)
    custom_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    custom_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_generated_post_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
