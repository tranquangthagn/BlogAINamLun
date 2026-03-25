from app.schemas.automation_generation import TrendRequestContext, TrendSignal


def build_generation_prompt(
    context: TrendRequestContext,
    signals: list[TrendSignal],
    max_signals: int = 3,
) -> str:
    lines = [
        "Ban la tro ly viet bai cho BlogAINamLun.",
        f"Nen tang uu tien: {context.source_label}.",
        f"Khoang trend: {context.range_label}.",
        "Viet 1 bai ngan, huu ich, tieng Viet khong dau.",
        'Tra ve JSON voi cac truong: "title", "content", "category", "topic_key".',
        "Khong them giai thich ngoai JSON.",
        "Tin hieu uu tien:",
    ]

    for signal in signals[:max_signals]:
        lines.append(f"Trend: {signal.title}")
        if signal.summary:
            lines.append(f"Tom tat: {signal.summary}")

    return "\n".join(lines)
