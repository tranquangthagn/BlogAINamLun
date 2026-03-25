from app.schemas.automation_generation import TrendRequestContext, TrendSignal


def build_generation_prompt(
    context: TrendRequestContext,
    signals: list[TrendSignal],
    max_signals: int = 1,
) -> str:
    tone_label = context.tone.replace("_", " ").strip() or "gần gũi"
    category_label = {
        "fashion": "Thời trang",
        "health": "Sức khỏe",
        "tips": "Mẹo vặt",
    }.get(context.category, context.category)

    lines = [
        "Bạn là trợ lý viết bài cho BlogAINamLun.",
        "Độc giả mục tiêu là nữ trẻ 18-25, có thể nới nhẹ tới dưới 30 nếu ngữ cảnh phù hợp.",
        "Giọng văn cần đáng yêu, gần gũi, mềm mại, hiện đại và dễ đọc.",
        f"Nền tảng ưu tiên: {context.source_label}.",
        f"Chuyên mục bài viết: {category_label}.",
        f"Khoảng trend: {context.range_label}.",
        f"Giọng điệu ưu tiên: {tone_label}.",
        "Viết 1 bài ngắn bằng tiếng Việt có dấu, tự nhiên như đang chia sẻ với một người bạn nữ trẻ.",
        "Không viết kiểu khô cứng, hàn lâm hoặc quá chung chung.",
        'Trả về JSON với các trường: "title", "content", "category", "topic_key".',
        "Không thêm giải thích ngoài JSON.",
        "Tín hiệu ưu tiên:",
    ]

    if context.focus_prompt.strip():
        lines.insert(7, f"Hướng viết thêm: {context.focus_prompt.strip()}.")

    for signal in signals[:max_signals]:
        lines.append(f"Trend: {signal.title}")
        if signal.summary:
            lines.append(f"Tóm tắt: {signal.summary}")

    return "\n".join(lines)
