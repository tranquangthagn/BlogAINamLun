from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class TrendSignal(BaseModel):
    source: str
    title: str
    summary: str | None = None
    url: str | None = None
    category_hint: str | None = None
    published_at: datetime | None = None
    score: float


class TrendRequestContext(BaseModel):
    sources: list[str]
    source_label: str
    trend_range_mode: str
    range_label: str
    tone: str = "trung_tinh"
    focus_prompt: str = ""
    custom_start: date | None = None
    custom_end: date | None = None


class GenerationDiagnostics(BaseModel):
    provider_mode: str
    generator_model: str
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
    fallback_used: bool = False
    diagnostics: GenerationDiagnostics | None = None

    model_config = ConfigDict(populate_by_name=True)
