import pytest

from app.schemas.automation_generation import AutomationBatchPlan, GeneratedCandidate, TrendSignal
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
            title=f"Bài {context.category} từ {primary_signal.title}",
            content=f"Nội dung có dấu cho {context.category}",
            source=context.source,
            category=context.category,
            topic_key=f"{context.category}-{self.calls}",
            fallback_used=False,
        )


def test_generate_preview_returns_three_posts_per_source(db_session, automation_settings_payload):
    service = AutomationService(
        db_session,
        trends=StubTrendCoordinator(
            [
                TrendSignal(source="tiktok", title="Trend A", score=0.9),
            ]
        ),
        generator=StubGenerator(),
    )

    preview = service.generate_preview_candidates(settings_payload=automation_settings_payload)

    assert preview.batch_id.startswith("batch-")
    assert len(preview.items) == 6
    assert {item.category for item in preview.items[:3]} == {"fashion", "health", "tips"}
    assert all(item.images for item in preview.items)


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


def test_post_now_from_settings_returns_batch_receipt(db_session, automation_settings_payload, monkeypatch):
    service = AutomationService(
        db_session,
        trends=StubTrendCoordinator([TrendSignal(source="tiktok", title="Trend A", score=0.9)]),
        generator=StubGenerator(),
    )
    service.update_settings(automation_settings_payload)

    enqueued = {}

    class RunnerStub:
        def enqueue(self, plans, start_async=True):
            enqueued["plans"] = plans
            enqueued["start_async"] = start_async

    monkeypatch.setattr("app.services.automation.get_automation_runner", lambda: RunnerStub())

    receipt = service.post_now_from_settings(start_async=False)
    history = service.list_history()

    assert receipt.mode == "queued"
    assert receipt.queued_count == 6
    assert len(enqueued["plans"]) == 6
    assert all(item.status == "queued" for item in history[:6])


def test_process_batch_job_publishes_post_and_updates_history(db_session):
    service = AutomationService(
        db_session,
        trends=StubTrendCoordinator(
            [
                TrendSignal(
                    source="tiktok",
                    title="Trend A",
                    summary="Tóm tắt đẹp",
                    score=0.9,
                    image_url="https://example.com/thumb.jpg",
                )
            ]
        ),
        generator=StubGenerator(),
    )
    receipt = service.queue_batch_from_settings(
        settings_payload={
            "enabled": True,
            "scheduleMode": "fixed_time",
            "postTime": "08:00",
            "intervalMinutes": 30,
            "sources": ["tiktok"],
            "trendRangeMode": "week",
            "customDateRange": {"start": None, "end": None},
            "tone": "gan_gui",
            "focusPrompt": "uu tien goc nhin nhe nhang",
        },
        start_async=False,
    )
    history_item = service.list_history()[0]

    plan = AutomationBatchPlan(
        batch_id=receipt.batch_id,
        source=history_item.source,
        source_label="TikTok",
        category=history_item.category,
        tone="gan_gui",
        focus_prompt="uu tien goc nhin nhe nhang",
        trend_range_mode="week",
        range_label="7 ngày gần đây",
        audience_profile="nu tre 18-25",
        allow_audience_expansion=True,
        history_id=history_item.id,
    )

    service.process_batch_job(plan)
    refreshed = service.get_history_item(history_item.id)

    assert refreshed.posted is True
    assert refreshed.status == "published"
    assert refreshed.image_urls_json is not None
