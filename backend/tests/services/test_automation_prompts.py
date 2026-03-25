from app.schemas.automation_generation import TrendRequestContext, TrendSignal
from app.services.automation_prompts import build_generation_prompt


def test_prompt_builder_requests_vietnamese_with_diacritics_and_persona_tone():
    context = TrendRequestContext(
        source="tiktok",
        sources=["tiktok"],
        source_label="TikTok",
        category="fashion",
        trend_range_mode="week",
        range_label="7 ngày gần đây",
        tone="gan_gui",
        focus_prompt="ưu tiên người mới bắt đầu",
        audience_profile="nu tre 18-25",
    )
    signals = [
        TrendSignal(source="tiktok", title="Trend A", score=0.9),
        TrendSignal(source="tiktok", title="Trend B", score=0.8),
    ]

    prompt = build_generation_prompt(context, signals)

    assert "tiếng Việt có dấu" in prompt
    assert "nữ trẻ 18-25" in prompt
    assert "đáng yêu, gần gũi" in prompt
    assert "Thời trang" in prompt
    assert "ưu tiên người mới bắt đầu" in prompt
    assert prompt.count("Trend:") == 1
