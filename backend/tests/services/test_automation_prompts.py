from app.schemas.automation_generation import TrendRequestContext, TrendSignal
from app.services.automation_prompts import build_generation_prompt


def test_prompt_builder_limits_signal_count_and_mentions_range():
    context = TrendRequestContext(
        sources=["tiktok"],
        source_label="TikTok",
        trend_range_mode="week",
        range_label="7 ngay gan day",
        tone="gan_gui",
        focus_prompt="uu tien nguoi moi bat dau",
    )
    signals = [
        TrendSignal(source="tiktok", title="Trend A", score=0.9),
        TrendSignal(source="tiktok", title="Trend B", score=0.8),
        TrendSignal(source="tiktok", title="Trend C", score=0.7),
        TrendSignal(source="tiktok", title="Trend D", score=0.6),
    ]

    prompt = build_generation_prompt(context, signals)

    assert "TikTok" in prompt
    assert "7 ngay gan day" in prompt
    assert "gan gui" in prompt
    assert "nguoi moi bat dau" in prompt
    assert prompt.count("Trend:") == 3
    assert "Trend D" not in prompt
