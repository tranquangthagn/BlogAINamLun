from datetime import date
from uuid import uuid4

from app.schemas.automation import AutomationSettingsPayload
from app.schemas.automation_generation import (
    AUTOMATION_BATCH_CATEGORIES,
    AutomationBatchPlan,
)


SOURCE_LABELS = {
    "facebook": "Facebook",
    "tiktok": "TikTok",
    "instagram": "Instagram",
    "shopee": "Shopee",
    "threads": "Threads",
}

RANGE_LABELS = {
    "day": "hôm nay",
    "week": "7 ngày gần đây",
    "quarter": "quý này",
    "custom": "khoảng ngày đã chọn",
}


class AutomationBatchPlanner:
    def plan(self, payload: AutomationSettingsPayload) -> list[AutomationBatchPlan]:
        batch_id = self._batch_id()
        custom_start = self._coerce_date(payload.custom_date_range.start)
        custom_end = self._coerce_date(payload.custom_date_range.end)
        range_label = self._range_label(payload)
        plans: list[AutomationBatchPlan] = []

        for source in payload.sources:
            source_label = SOURCE_LABELS.get(source, source.title())
            for category in AUTOMATION_BATCH_CATEGORIES:
                plans.append(
                    AutomationBatchPlan(
                        batch_id=batch_id,
                        source=source,
                        source_label=source_label,
                        category=category,
                        tone=payload.tone,
                        focus_prompt=payload.focus_prompt,
                        trend_range_mode=payload.trend_range_mode,
                        range_label=range_label,
                        audience_profile="nu tre 18-25",
                        allow_audience_expansion=True,
                        custom_start=custom_start,
                        custom_end=custom_end,
                    )
                )

        return plans

    def _batch_id(self) -> str:
        return f"batch-{uuid4().hex[:12]}"

    def _range_label(self, payload: AutomationSettingsPayload) -> str:
        if payload.trend_range_mode != "custom":
            return RANGE_LABELS[payload.trend_range_mode]
        if payload.custom_date_range.start and payload.custom_date_range.end:
            return f"{payload.custom_date_range.start} đến {payload.custom_date_range.end}"
        return RANGE_LABELS["custom"]

    def _coerce_date(self, raw_value: str | None) -> date | None:
        if not raw_value:
            return None
        return date.fromisoformat(raw_value)
