from pydantic import BaseModel, ConfigDict, Field

from app.schemas.automation_generation import PreviewInsight


class CustomDateRangePayload(BaseModel):
    start: str | None = None
    end: str | None = None


class AutomationSettingsPayload(BaseModel):
    enabled: bool
    schedule_mode: str = Field(alias="scheduleMode")
    post_time: str = Field(alias="postTime")
    interval_minutes: int = Field(alias="intervalMinutes")
    sources: list[str]
    trend_range_mode: str = Field(alias="trendRangeMode")
    custom_date_range: CustomDateRangePayload = Field(alias="customDateRange")
    tone: str = "trung_tinh"
    focus_prompt: str = Field(default="", alias="focusPrompt")

    model_config = ConfigDict(populate_by_name=True)


class AutomationSettingsResponse(AutomationSettingsPayload):
    last_run_at: str | None = Field(default=None, alias="lastRunAt")
    last_generated_post_id: int | None = Field(default=None, alias="lastGeneratedPostId")


class AutomationPreviewResponse(BaseModel):
    id: int
    title: str
    content: str
    source: str
    topic_key: str = Field(alias="topicKey")
    created_at: str = Field(alias="createdAt")
    posted: bool
    category: str
    insights: list[PreviewInsight] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)
