import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.automation_history import AutomationHistory
from app.models.automation_settings import AutomationSettings
from app.models.post import Post
from app.models.post_image import PostImage
from app.repositories.automation import AutomationRepository
from app.repositories.posts import PostsRepository
from app.schemas.automation import (
    AutomationBatchItemResponse,
    AutomationBatchReceiptResponse,
    AutomationPreviewBatchResponse,
    AutomationSettingsPayload,
    AutomationSettingsResponse,
)
from app.schemas.automation_generation import (
    AutomationBatchPlan,
    AutomationBatchReceipt,
    GeneratedCandidate,
    PreviewInsight,
    TrendRequestContext,
    TrendSignal,
)
from app.services.automation_batch import AutomationBatchPlanner
from app.services.automation_gemini import AutomationGenerationError, GeminiContentGenerator
from app.services.automation_images import AutomationImageProvider
from app.services.automation_runner import get_automation_runner
from app.services.automation_trends import AutomationTrendCoordinator
from app.services.posts import serialize_post


def title_fingerprint(title: str) -> str:
    return " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in title).split())


class AutomationService:
    def __init__(
        self,
        session: Session,
        trends: AutomationTrendCoordinator | None = None,
        generator: GeminiContentGenerator | None = None,
        planner: AutomationBatchPlanner | None = None,
        images: AutomationImageProvider | None = None,
    ):
        self.session = session
        self.repository = AutomationRepository(session)
        self.posts_repository = PostsRepository(session)
        self.trends = trends or AutomationTrendCoordinator()
        self.generator = generator or GeminiContentGenerator()
        self.planner = planner or AutomationBatchPlanner()
        self.images = images or AutomationImageProvider()

    def _default_settings(self) -> AutomationSettings:
        return AutomationSettings(
            enabled=False,
            schedule_mode="fixed_time",
            post_time="08:00",
            interval_minutes=30,
            sources=["tiktok", "threads"],
            trend_range_mode="week",
            tone="gan_gui",
            focus_prompt="",
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

    def _to_settings_response(self, settings: AutomationSettings) -> AutomationSettingsResponse:
        return AutomationSettingsResponse(
            enabled=settings.enabled,
            scheduleMode=settings.schedule_mode,
            postTime=settings.post_time,
            intervalMinutes=settings.interval_minutes,
            sources=settings.sources,
            trendRangeMode=settings.trend_range_mode,
            tone=settings.tone,
            focusPrompt=settings.focus_prompt,
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
        settings.tone = payload.tone
        settings.focus_prompt = payload.focus_prompt
        settings.custom_start = payload.custom_date_range.start and datetime.fromisoformat(
            f"{payload.custom_date_range.start}T00:00:00"
        ).date()
        settings.custom_end = payload.custom_date_range.end and datetime.fromisoformat(
            f"{payload.custom_date_range.end}T00:00:00"
        ).date()
        settings.updated_at = datetime.now()

        self.repository.save_settings(settings)
        self.session.commit()
        self.session.refresh(settings)
        return self._to_settings_response(settings)

    def _deserialize_images(self, raw_value: str | None) -> list[str]:
        if not raw_value:
            return []
        try:
            payload = json.loads(raw_value)
        except json.JSONDecodeError:
            return []
        return [item for item in payload if isinstance(item, str)]

    def _history_to_response(
        self,
        item: AutomationHistory,
        insights: list[PreviewInsight] | None = None,
    ) -> AutomationBatchItemResponse:
        return AutomationBatchItemResponse(
            id=item.id,
            batchId=item.batch_id or "",
            title=item.title,
            content=item.content,
            source=item.source,
            topicKey=item.topic_key,
            createdAt=item.created_at.isoformat(),
            posted=item.posted,
            category=item.category,
            status=item.status,
            failureReason=item.failure_reason,
            images=self._deserialize_images(item.image_urls_json),
            insights=insights or [],
        )

    def list_history(self) -> list[AutomationBatchItemResponse]:
        return [self._history_to_response(item) for item in self.repository.list_history()]

    def _build_request_context(self, plan: AutomationBatchPlan) -> TrendRequestContext:
        return TrendRequestContext(
            source=plan.source,
            sources=[plan.source],
            source_label=plan.source_label,
            category=plan.category,
            trend_range_mode=plan.trend_range_mode,
            range_label=plan.range_label,
            tone=plan.tone,
            focus_prompt=plan.focus_prompt,
            audience_profile=plan.audience_profile,
            allow_audience_expansion=plan.allow_audience_expansion,
            custom_start=plan.custom_start,
            custom_end=plan.custom_end,
        )

    def _generate_candidate_for_plan(self, plan: AutomationBatchPlan) -> tuple[GeneratedCandidate, list[TrendSignal]]:
        context = self._build_request_context(plan)
        signals = self.trends.collect(context)
        if not signals:
            raise AutomationGenerationError("No usable trend signals found")

        signal = signals[0]
        candidate = self.generator.generate(context, [signal])
        images = self.images.resolve_images(plan.source, plan.category, signal)
        candidate = candidate.model_copy(
            update={
                "source": plan.source,
                "category": plan.category,
                "images": images,
            }
        )
        return candidate, [signal]

    def generate_preview_candidates(
        self,
        settings_payload: dict | AutomationSettingsPayload | None = None,
    ) -> AutomationPreviewBatchResponse:
        payload = self._coerce_payload(settings_payload or self.get_settings().model_dump(by_alias=True))
        plans = self.planner.plan(payload)
        now = datetime.now()
        next_id = max([item.id for item in self.repository.list_history()], default=0) + 1
        items: list[AutomationBatchItemResponse] = []
        recent_titles = {title_fingerprint(item.title) for item in self.repository.list_history()[:12] if item.title}

        for index, plan in enumerate(plans):
            candidate, signals = self._generate_candidate_for_plan(plan)
            if title_fingerprint(candidate.title) in recent_titles:
                candidate = candidate.model_copy(update={"title": f"{candidate.title} ({plan.category})"})
            preview_id = next_id + index
            items.append(
                AutomationBatchItemResponse(
                    id=preview_id,
                    batchId=plan.batch_id,
                    title=candidate.title,
                    content=candidate.content,
                    source=candidate.source,
                    topicKey=candidate.topic_key,
                    createdAt=(now).isoformat(),
                    posted=False,
                    category=candidate.category,
                    status="preview",
                    failureReason=None,
                    images=candidate.images,
                    insights=[
                        PreviewInsight(
                            title=signal.title,
                            summary=signal.summary,
                            url=signal.url,
                            score=signal.score,
                            published_at=signal.published_at,
                        )
                        for signal in signals
                    ],
                )
            )

        return AutomationPreviewBatchResponse(batchId=plans[0].batch_id if plans else "", items=items)

    def record_candidates(self, previews: list[AutomationBatchItemResponse]) -> list[AutomationBatchItemResponse]:
        for preview in previews:
            self.repository.add_history_item(
                AutomationHistory(
                    id=preview.id,
                    batch_id=preview.batch_id,
                    title=preview.title,
                    content=preview.content,
                    source=preview.source,
                    topic_key=preview.topic_key,
                    category=preview.category,
                    status=preview.status,
                    failure_reason=preview.failure_reason,
                    image_urls_json=json.dumps(preview.images),
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

    def _publish_candidate(self, item: AutomationHistory) -> Post:
        post = Post(
            author="Trợ lý AI",
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

        for index, image_url in enumerate(self._deserialize_images(item.image_urls_json)):
            post.images.append(PostImage(image_url=image_url, position=index))

        self.session.flush()
        return post

    def publish_candidate_now(self, item_id: int) -> Post:
        item = self.get_history_item(item_id)
        post = self._publish_candidate(item)

        settings = self._ensure_settings_row()
        item.posted = True
        item.status = "published"
        item.published_post_id = post.id
        settings.last_run_at = datetime.now()
        settings.last_generated_post_id = item.id
        settings.updated_at = datetime.now()

        self.session.commit()
        self.session.refresh(post)
        return post

    def queue_batch_from_settings(
        self,
        settings_payload: dict | AutomationSettingsPayload | None = None,
        start_async: bool = True,
    ) -> AutomationBatchReceiptResponse:
        payload = self._coerce_payload(settings_payload or self.get_settings().model_dump(by_alias=True))
        plans = self.planner.plan(payload)
        history_rows: list[AutomationHistory] = []
        now = datetime.now()

        for plan in plans:
            history_rows.append(
                AutomationHistory(
                    batch_id=plan.batch_id,
                    title="",
                    content="",
                    source=plan.source,
                    topic_key=f"{plan.category}-pending",
                    category=plan.category,
                    status="queued",
                    failure_reason=None,
                    image_urls_json="[]",
                    created_at=now,
                    posted=False,
                    published_post_id=None,
                )
            )

        for row in history_rows:
            self.repository.add_history_item(row)

        self.session.commit()

        for plan, row in zip(plans, history_rows, strict=False):
            plan.history_id = row.id

        receipt = AutomationBatchReceipt(
            batch_id=plans[0].batch_id if plans else "",
            queued_count=len(plans),
            mode="queued",
        )
        get_automation_runner().enqueue(plans, start_async=start_async)
        return AutomationBatchReceiptResponse(
            batchId=receipt.batch_id,
            queuedCount=receipt.queued_count,
            mode=receipt.mode,
        )

    def post_now_from_settings(self, start_async: bool = True) -> AutomationBatchReceiptResponse:
        return self.queue_batch_from_settings(start_async=start_async)

    def process_batch_job(self, plan: AutomationBatchPlan) -> None:
        if plan.history_id is None:
            raise ValueError("history_id is required to process a batch job")

        item = self.get_history_item(plan.history_id)
        item.status = "processing"
        item.failure_reason = None
        self.session.commit()

        try:
            candidate, signals = self._generate_candidate_for_plan(plan)
            item.title = candidate.title
            item.content = candidate.content
            item.topic_key = candidate.topic_key
            item.status = "generated"
            item.image_urls_json = json.dumps(candidate.images)
            item.failure_reason = None
            self.session.commit()

            post = self._publish_candidate(item)
            settings = self._ensure_settings_row()
            item.posted = True
            item.status = "published"
            item.published_post_id = post.id
            settings.last_run_at = datetime.now()
            settings.last_generated_post_id = item.id
            settings.updated_at = datetime.now()
            self.session.commit()
        except Exception as exc:
            item.status = "failed"
            item.failure_reason = str(exc)
            self.session.commit()
            if isinstance(exc, AutomationGenerationError):
                return
            return

    def post_response_for_history_item(self, item_id: int):
        post = self.publish_candidate_now(item_id)
        return serialize_post(post)
