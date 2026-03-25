from datetime import datetime

from app.core.scheduler import run_scheduler_tick
from app.services.automation import AutomationService
from app.services.automation_gemini import AutomationGenerationError


def test_scheduler_tick_skips_when_not_due(db_session, automation_settings_payload):
    service = AutomationService(db_session)
    payload = {
        **automation_settings_payload,
        "scheduleMode": "interval_minutes",
        "intervalMinutes": 30,
    }
    service.update_settings(payload)

    settings = service._ensure_settings_row()
    settings.last_run_at = datetime.now()
    db_session.commit()

    result = run_scheduler_tick(db_session)
    assert result.executed is False
    assert result.reason == "not_due"


def test_scheduler_tick_queues_batch_when_due(db_session, automation_settings_payload, monkeypatch):
    service = AutomationService(db_session)
    service.update_settings(automation_settings_payload)

    def stub_queue(self):
        return {"batchId": "batch-queue", "queuedCount": 6, "mode": "queued"}

    monkeypatch.setattr(AutomationService, "post_now_from_settings", stub_queue)

    result = run_scheduler_tick(db_session)

    assert result.executed is True
    assert result.reason == "queued"


def test_scheduler_tick_returns_generation_failed_when_pipeline_errors(db_session, automation_settings_payload, monkeypatch):
    service = AutomationService(db_session)
    service.update_settings(automation_settings_payload)

    def raise_generation_failure(self):
        raise AutomationGenerationError("generation failed")

    monkeypatch.setattr(AutomationService, "post_now_from_settings", raise_generation_failure)

    result = run_scheduler_tick(db_session)

    assert result.executed is False
    assert result.reason == "generation_failed"
