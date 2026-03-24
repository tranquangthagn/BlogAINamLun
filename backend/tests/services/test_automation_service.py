from app.services.automation import AutomationService


def test_generate_preview_avoids_recent_duplicate_title(db_session, automation_settings_payload):
    service = AutomationService(db_session)

    first = service.generate_preview_candidates(settings_payload=automation_settings_payload)
    service.record_candidates(first)
    second = service.generate_preview_candidates(settings_payload=automation_settings_payload)

    assert first[0].title != second[0].title
