from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


AUTOMATION_BATCH_CATEGORIES = ("fashion", "health", "tips")


class TrendSignal(BaseModel):
    source: str
    title: str
    summary: str | None = None
    url: str | None = None
    image_url: str | None = None
    category_hint: str | None = None
    published_at: datetime | None = None
    score: float


class TrendRequestContext(BaseModel):
    source: str
    sources: list[str]
    source_label: str
    category: str
    trend_range_mode: str
    range_label: str
    tone: str = "trung_tinh"
    focus_prompt: str = ""
    audience_profile: str = "nu tre 18-25"
    allow_audience_expansion: bool = True
    custom_start: date | None = None
    custom_end: date | None = None


class GenerationDiagnostics(BaseModel):
    provider_mode: str
    generator_model: str
    audience_profile: str
    fallback_reason: str | None = None


class PreviewInsight(BaseModel):
    title: str
    summary: str | None = None
    url: str | None = None
    score: float
    published_at: datetime | None = None


class GeneratedCandidate(BaseModel):
    title: str
    content: str
    source: str
    category: str
    topic_key: str
    insights: list[PreviewInsight] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    fallback_used: bool = False
    diagnostics: GenerationDiagnostics | None = None

    model_config = ConfigDict(populate_by_name=True)


class AutomationBatchPlan(BaseModel):
    batch_id: str
    source: str
    source_label: str
    category: str
    tone: str
    focus_prompt: str
    trend_range_mode: str
    range_label: str
    audience_profile: str
    allow_audience_expansion: bool = True
    custom_start: date | None = None
    custom_end: date | None = None
    history_id: int | None = None


class AutomationBatchReceipt(BaseModel):
    batch_id: str
    queued_count: int
    mode: str = "queued"
