import pytest

from app.schemas.automation_generation import GeneratedCandidate, TrendSignal
from app.services.automation import AutomationService
from app.services.automation_gemini import AutomationQuotaError


class StubTrendCoordinator:
    def __init__(self, signals):
        self.signals = signals

    def collect(self, context):
        return list(self.signals)


class StubGenerator:
    def __init__(self):
        self.calls = 0

    def generate(self, context, signals):
        self.calls += 1
        primary_signal = signals[0]
        return GeneratedCandidate(
            title=f"AI {primary_signal.title}",
            content=f"Noi dung cho {primary_signal.title}",
            source=context.sources[0],
            category=primary_signal.category_hint or "general",
            topic_key=primary_signal.title.lower().replace(" ", "-"),
            fallback_used=False,
        )


def test_generate_preview_avoids_recent_duplicate_title(db_session, automation_settings_payload):
    service = AutomationService(
        db_session,
        trends=StubTrendCoordinator(
            [
                TrendSignal(source="tiktok", title="Trend A", score=0.9),
                TrendSignal(source="tiktok", title="Trend B", score=0.8),
            ]
        ),
        generator=StubGenerator(),
    )

    first = service.generate_preview_candidates(settings_payload=automation_settings_payload)
    service.record_candidates(first)
    second = service.generate_preview_candidates(settings_payload=automation_settings_payload)

    assert first[0].title != second[0].title


class ErroringGenerator:
    def generate(self, context, signals):
        raise AutomationQuotaError("quota")


def test_generate_preview_propagates_generation_failures(db_session, automation_settings_payload):
    service = AutomationService(
        db_session,
        trends=StubTrendCoordinator([TrendSignal(source="tiktok", title="Trend A", score=0.9)]),
        generator=ErroringGenerator(),
    )

    with pytest.raises(AutomationQuotaError):
        service.generate_preview_candidates(settings_payload=automation_settings_payload)


def test_post_now_from_settings_uses_generated_candidate_pipeline(db_session, automation_settings_payload):
    service = AutomationService(
        db_session,
        trends=StubTrendCoordinator([TrendSignal(source="tiktok", title="Trend A", score=0.9)]),
        generator=StubGenerator(),
    )
    service.update_settings(automation_settings_payload)

    post = service.post_now_from_settings()
    history = service.list_history()

    assert "AI Trend A" in post.content
    assert history[0].posted is True


def test_generate_preview_carries_selected_trend_insights(db_session, automation_settings_payload):
    service = AutomationService(
        db_session,
        trends=StubTrendCoordinator(
            [
                TrendSignal(
                    source="tiktok",
                    title="Trend A",
                    summary="Tom tat cho trend A",
                    url="https://example.com/trend-a",
                    score=0.9,
                )
            ]
        ),
        generator=StubGenerator(),
    )

    preview = service.generate_preview_candidates(settings_payload=automation_settings_payload)[0]

    assert preview.insights[0].title == "Trend A"
    assert preview.insights[0].summary == "Tom tat cho trend A"
    assert preview.insights[0].url == "https://example.com/trend-a"
