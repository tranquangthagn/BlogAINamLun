from dataclasses import dataclass
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.services.automation_gemini import AutomationGenerationError
from app.services.automation import AutomationService


@dataclass
class SchedulerTickResult:
    executed: bool
    reason: str | None = None


def should_run_automation_now(service: AutomationService, now: datetime | None = None) -> bool:
    current = now or datetime.now()
    settings = service._ensure_settings_row()
    if not settings.enabled:
        return False

    if settings.schedule_mode == "interval_minutes":
        if settings.last_run_at is None:
            return True
        diff_seconds = (current - settings.last_run_at).total_seconds()
        return diff_seconds >= settings.interval_minutes * 60

    hours, minutes = [int(part) for part in settings.post_time.split(":")]
    threshold = current.replace(hour=hours, minute=minutes, second=0, microsecond=0)
    if current < threshold:
        return False
    if settings.last_run_at is None:
        return True
    return settings.last_run_at.date() != current.date()


def run_scheduler_tick(session: Session) -> SchedulerTickResult:
    service = AutomationService(session)
    if not should_run_automation_now(service):
        return SchedulerTickResult(executed=False, reason="not_due")

    try:
        service.post_now_from_settings()
    except AutomationGenerationError:
        return SchedulerTickResult(executed=False, reason="generation_failed")

    return SchedulerTickResult(executed=True, reason="published")


def create_scheduler(session_factory) -> BackgroundScheduler:
    scheduler = BackgroundScheduler()

    def scheduled_job():
        session = session_factory()
        try:
            run_scheduler_tick(session)
        finally:
            session.close()

    scheduler.add_job(scheduled_job, "interval", minutes=1, id="automation-tick", replace_existing=True)
    return scheduler


def start_scheduler(session_factory) -> BackgroundScheduler | None:
    settings = get_settings()
    if not settings.enable_scheduler:
        return None

    scheduler = create_scheduler(session_factory)
    scheduler.start()
    return scheduler
