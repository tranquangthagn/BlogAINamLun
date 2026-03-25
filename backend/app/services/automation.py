from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.automation_history import AutomationHistory
from app.models.automation_settings import AutomationSettings
from app.models.post import Post
from app.repositories.automation import AutomationRepository
from app.repositories.posts import PostsRepository
from app.schemas.posts import PostResponse
from app.schemas.automation import (
    AutomationPreviewResponse,
    AutomationSettingsPayload,
    AutomationSettingsResponse,
)
from app.schemas.automation_generation import GeneratedCandidate, TrendRequestContext
from app.services.posts import serialize_post
from app.services.automation_gemini import AutomationGenerationError, GeminiContentGenerator
from app.services.automation_trends import AutomationTrendCoordinator


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
    def __init__(
        self,
        session: Session,
        trends: AutomationTrendCoordinator | None = None,
        generator: GeminiContentGenerator | None = None,
    ):
        self.session = session
        self.repository = AutomationRepository(session)
        self.posts_repository = PostsRepository(session)
        self.trends = trends or AutomationTrendCoordinator()
        self.generator = generator or GeminiContentGenerator()

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

    def _coerce_payload(self, payload: dict | AutomationSettingsPayload) -> AutomationSettingsPayload:
        if isinstance(payload, AutomationSettingsPayload):
            return payload
        return AutomationSettingsPayload.model_validate(payload)

    def update_settings(self, payload: dict | AutomationSettingsPayload) -> AutomationSettingsResponse:
        payload = self._coerce_payload(payload)
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

    def _build_request_context(self, payload: AutomationSettingsPayload) -> TrendRequestContext:
        primary_source = payload.sources[0]
        return TrendRequestContext(
            sources=payload.sources,
            source_label=SOURCE_LABELS.get(primary_source, primary_source.title()),
            trend_range_mode=payload.trend_range_mode,
            range_label=self._range_label(payload),
            custom_start=date.fromisoformat(payload.custom_date_range.start)
            if payload.custom_date_range.start
            else None,
            custom_end=date.fromisoformat(payload.custom_date_range.end) if payload.custom_date_range.end else None,
        )

    def _preview_from_candidate(
        self,
        candidate: GeneratedCandidate,
        preview_id: int,
        created_at: str | None = None,
    ) -> AutomationPreviewResponse:
        return AutomationPreviewResponse(
            id=preview_id,
            title=candidate.title,
            content=candidate.content,
            source=candidate.source,
            topicKey=candidate.topic_key,
            createdAt=created_at or datetime.now().isoformat(),
            posted=False,
            category=candidate.category,
        )

    def generate_preview_candidates(
        self,
        settings_payload: dict | AutomationSettingsPayload | None = None,
    ) -> list[AutomationPreviewResponse]:
        payload = self._coerce_payload(settings_payload or self.get_settings().model_dump(by_alias=True))
        history = self.repository.list_history()
        recent_titles = {title_fingerprint(item.title) for item in history[:8]}
        next_id = max([item.id for item in history], default=0) + 1
        context = self._build_request_context(payload)
        signals = self.trends.collect(context)
        if not signals:
            raise AutomationGenerationError("No usable trend signals found")

        for signal in signals:
            candidate = self.generator.generate(context, [signal])
            if title_fingerprint(candidate.title) in recent_titles:
                continue
            return [self._preview_from_candidate(candidate, preview_id=next_id)]

        candidate = self.generator.generate(context, [signals[0]])
        return [self._preview_from_candidate(candidate, preview_id=next_id)]

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

    def get_history_item(self, item_id: int) -> AutomationHistory:
        item = self.repository.get_history_item(item_id)
        if item is None:
            raise ValueError(f"History item {item_id} not found")
        return item

    def publish_candidate_now(self, item_id: int) -> Post:
        item = self.get_history_item(item_id)
        settings = self._ensure_settings_row()
        post = Post(
            author="Tro ly AI",
            avatar="https://api.dicebear.com/7.x/bottts/svg?seed=NamLunAI",
            content=f"{item.title}\n\n{item.content}",
            category=item.category,
            created_at=item.created_at,
            likes=0,
            comments=0,
            source_type="automation",
        )
        self.posts_repository.add_post(post)
        self.session.flush()

        item.posted = True
        item.published_post_id = post.id
        settings.last_run_at = item.created_at
        settings.last_generated_post_id = item.id
        settings.updated_at = datetime.now()

        self.session.commit()
        self.session.refresh(post)
        return post

    def post_now_from_settings(self) -> PostResponse:
        settings = self.get_settings()
        previews = self.generate_preview_candidates(settings_payload=settings.model_dump(by_alias=True))
        self.record_candidates(previews)
        post = self.publish_candidate_now(previews[0].id)
        return serialize_post(post)
