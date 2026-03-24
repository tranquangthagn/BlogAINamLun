from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.automation_history import AutomationHistory
from app.models.automation_settings import AutomationSettings
from app.repositories.automation import AutomationRepository
from app.schemas.automation import (
    AutomationPreviewResponse,
    AutomationSettingsPayload,
    AutomationSettingsResponse,
)


TOPIC_TEMPLATES = [
    {
        "topic_key": "short-form-hook",
        "category": "general",
        "title": lambda source, range_label: f"{source} dang chuong mo bai cham cam xuc trong {range_label}",
        "content": lambda source, range_label: f"Tin hieu mo phong tu {source} trong {range_label} cho thay kieu mo bai doi thuong dang giu nhip tuong tac kha tot.",
    },
    {
        "topic_key": "beauty-routine",
        "category": "fashion",
        "title": lambda source, range_label: f"Trend lam dep toi gian tu {source} noi bat trong {range_label}",
        "content": lambda source, range_label: f"Du lieu mo phong tu {source} trong {range_label} dang nghieng ve noi dung cham chut ve ngoai toi gian va de ap dung ngay.",
    },
    {
        "topic_key": "healthy-reset",
        "category": "health",
        "title": lambda source, range_label: f"{source} dang day manh noi dung reset nang luong trong {range_label}",
        "content": lambda source, range_label: f"Trong {range_label}, {source} noi len cac chu de xoay quanh phuc hoi nang luong va cham soc suc khoe.",
    },
    {
        "topic_key": "smart-saving-tip",
        "category": "tips",
        "title": lambda source, range_label: f"Meo chi tieu thong minh tu trend {source} trong {range_label}",
        "content": lambda source, range_label: f"Trend mo phong tren {source} trong {range_label} cho thay nguoi xem quan tam cac meo thuc dung va de ap dung.",
    },
]

SOURCE_LABELS = {
    "facebook": "Facebook",
    "tiktok": "TikTok",
    "instagram": "Instagram",
    "shopee": "Shopee",
    "threads": "Threads",
}

RANGE_LABELS = {
    "day": "hom nay",
    "week": "7 ngay gan day",
    "quarter": "quy nay",
    "custom": "khoang ngay da chon",
}


def title_fingerprint(title: str) -> str:
    return " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in title).split())


class AutomationService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = AutomationRepository(session)

    def _default_settings(self) -> AutomationSettings:
        return AutomationSettings(
            enabled=False,
            schedule_mode="fixed_time",
            post_time="08:00",
            interval_minutes=30,
            sources=["tiktok", "threads"],
            trend_range_mode="week",
            custom_start=None,
            custom_end=None,
            last_run_at=None,
            last_generated_post_id=None,
            updated_at=datetime.now(),
        )

    def _ensure_settings_row(self) -> AutomationSettings:
        settings = self.repository.get_settings()
        if settings is None:
            settings = self._default_settings()
            self.repository.save_settings(settings)
            self.session.commit()
            self.session.refresh(settings)
        return settings

    def _range_label(self, payload: AutomationSettingsPayload) -> str:
        if payload.trend_range_mode != "custom":
            return RANGE_LABELS[payload.trend_range_mode]
        if payload.custom_date_range.start and payload.custom_date_range.end:
            return f"{payload.custom_date_range.start} den {payload.custom_date_range.end}"
        return RANGE_LABELS["custom"]

    def _to_settings_response(self, settings: AutomationSettings) -> AutomationSettingsResponse:
        return AutomationSettingsResponse(
            enabled=settings.enabled,
            scheduleMode=settings.schedule_mode,
            postTime=settings.post_time,
            intervalMinutes=settings.interval_minutes,
            sources=settings.sources,
            trendRangeMode=settings.trend_range_mode,
            customDateRange={
                "start": settings.custom_start.isoformat() if settings.custom_start else None,
                "end": settings.custom_end.isoformat() if settings.custom_end else None,
            },
            lastRunAt=settings.last_run_at.isoformat() if settings.last_run_at else None,
            lastGeneratedPostId=settings.last_generated_post_id,
        )

    def get_settings(self) -> AutomationSettingsResponse:
        return self._to_settings_response(self._ensure_settings_row())

    def update_settings(self, payload: AutomationSettingsPayload) -> AutomationSettingsResponse:
        settings = self._ensure_settings_row()
        settings.enabled = payload.enabled
        settings.schedule_mode = payload.schedule_mode
        settings.post_time = payload.post_time
        settings.interval_minutes = payload.interval_minutes
        settings.sources = payload.sources
        settings.trend_range_mode = payload.trend_range_mode
        settings.custom_start = (
            date.fromisoformat(payload.custom_date_range.start) if payload.custom_date_range.start else None
        )
        settings.custom_end = date.fromisoformat(payload.custom_date_range.end) if payload.custom_date_range.end else None
        settings.updated_at = datetime.now()

        self.repository.save_settings(settings)
        self.session.commit()
        self.session.refresh(settings)
        return self._to_settings_response(settings)

    def list_history(self) -> list[AutomationPreviewResponse]:
        return [
            AutomationPreviewResponse(
                id=item.id,
                title=item.title,
                content=item.content,
                source=item.source,
                topicKey=item.topic_key,
                createdAt=item.created_at.isoformat(),
                posted=item.posted,
                category=item.category,
            )
            for item in self.repository.list_history()
        ]

    def generate_preview_candidates(
        self,
        settings_payload: dict | AutomationSettingsPayload | None = None,
    ) -> list[AutomationPreviewResponse]:
        payload = (
            settings_payload
            if isinstance(settings_payload, AutomationSettingsPayload)
            else AutomationSettingsPayload.model_validate(settings_payload or self.get_settings().model_dump(by_alias=True))
        )
        history = self.repository.list_history()
        recent_titles = {title_fingerprint(item.title) for item in history[:8]}
        next_id = max([item.id for item in history], default=0) + 1
        source = payload.sources[0]
        source_label = SOURCE_LABELS[source]
        range_label = self._range_label(payload)

        previews: list[AutomationPreviewResponse] = []
        for template in TOPIC_TEMPLATES:
            title = template["title"](source_label, range_label)
            if title_fingerprint(title) in recent_titles:
                continue

            preview = AutomationPreviewResponse(
                id=next_id,
                title=title,
                content=template["content"](source_label, range_label),
                source=source,
                topicKey=template["topic_key"],
                createdAt=datetime.now().isoformat(),
                posted=False,
                category=template["category"],
            )
            previews.append(preview)
            break

        if not previews:
            template = TOPIC_TEMPLATES[0]
            previews.append(
                AutomationPreviewResponse(
                    id=next_id,
                    title=template["title"](source_label, range_label),
                    content=template["content"](source_label, range_label),
                    source=source,
                    topicKey=template["topic_key"],
                    createdAt=datetime.now().isoformat(),
                    posted=False,
                    category=template["category"],
                )
            )

        return previews

    def record_candidates(self, previews: list[AutomationPreviewResponse]) -> list[AutomationPreviewResponse]:
        for preview in previews:
            self.repository.add_history_item(
                AutomationHistory(
                    id=preview.id,
                    title=preview.title,
                    content=preview.content,
                    source=preview.source,
                    topic_key=preview.topic_key,
                    category=preview.category,
                    created_at=datetime.fromisoformat(preview.created_at),
                    posted=preview.posted,
                    published_post_id=None,
                )
            )
        self.session.commit()
        return previews
