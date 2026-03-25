from datetime import datetime

from app.services.automation import AutomationService
from app.services.automation_gemini import AutomationGenerationError
from app.core.scheduler import run_scheduler_tick


def test_post_now_creates_feed_post_and_marks_history_posted(db_session, automation_settings_payload):
    service = AutomationService(db_session)
    service.update_settings(automation_settings_payload)

    preview = service.generate_preview_candidates(settings_payload=automation_settings_payload)[0]
    service.record_candidates([preview])
    published = service.publish_candidate_now(preview.id)

    assert published.source_type == "automation"
    assert service.get_history_item(preview.id).posted is True


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


def test_scheduler_tick_returns_generation_failed_when_pipeline_errors(db_session, automation_settings_payload, monkeypatch):
    service = AutomationService(db_session)
    service.update_settings(automation_settings_payload)

    def raise_generation_failure(self):
        raise AutomationGenerationError("generation failed")

    monkeypatch.setattr(AutomationService, "post_now_from_settings", raise_generation_failure)

    result = run_scheduler_tick(db_session)

    assert result.executed is False
    assert result.reason == "generation_failed"
