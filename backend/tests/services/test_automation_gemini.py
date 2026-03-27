import pytest

from app.core.config import Settings
from app.schemas.automation_generation import (
    GeneratedCandidate,
    GenerationDiagnostics,
    TrendRequestContext,
    TrendSignal,
)
from app.services.automation_gemini import (
    AutomationConfigurationError,
    AutomationQuotaError,
    GeminiContentGenerator,
)


def test_generated_candidate_carries_fallback_metadata():
    candidate = GeneratedCandidate(
        title="AI title",
        content="AI body",
        source="tiktok",
        category="general",
        topic_key="creator-hook",
        insights=[],
        fallback_used=False,
    )

    assert candidate.fallback_used is False
    assert candidate.topic_key == "creator-hook"


def test_generation_diagnostics_tracks_provider_path():
    diagnostics = GenerationDiagnostics(
        provider_mode="pragmatic_real",
        generator_model="gemini-2.5-flash",
        audience_profile="nu tre 18-25",
        fallback_reason=None,
    )

    assert diagnostics.provider_mode == "pragmatic_real"
    assert diagnostics.generator_model == "gemini-2.5-flash"


class FakeRateLimitError(Exception):
    pass


class FakeModels:
    def __init__(self, response_text=None, error=None):
        self.response_text = response_text
        self.error = error

    def generate_content(self, **kwargs):
        if self.error is not None:
            raise self.error
        return type("FakeResponse", (), {"text": self.response_text})()


class FakeClient:
    def __init__(self, response_text=None, error=None):
        self.models = FakeModels(response_text=response_text, error=error)


def build_context():
    return TrendRequestContext(
        source="tiktok",
        sources=["tiktok"],
        source_label="TikTok",
        category="fashion",
        trend_range_mode="week",
        range_label="7 ngày gần đây",
    )


def build_signals():
    return [
        TrendSignal(
            source="tiktok",
            title="Hot creator hook",
            summary="Short-form intros are performing well.",
            score=0.9,
        )
    ]


def test_gemini_wrapper_requires_api_key():
    generator = GeminiContentGenerator(
        settings=Settings(
            database_url="sqlite+pysqlite:///:memory:",
            gemini_api_key=None,
            gemini_model="gemini-2.5-flash",
        )
    )

    with pytest.raises(AutomationConfigurationError):
        generator.generate(build_context(), build_signals())


def test_gemini_wrapper_parses_structured_candidate():
    client = FakeClient(
        response_text='{"title":"AI title","content":"AI body","category":"general","topic_key":"creator-hook"}'
    )
    generator = GeminiContentGenerator(
        settings=Settings(
            database_url="sqlite+pysqlite:///:memory:",
            gemini_api_key="test-key",
            gemini_model="gemini-2.5-flash",
        ),
        client=client,
    )

    candidate = generator.generate(build_context(), build_signals())

    assert candidate.title == "AI title"
    assert candidate.source == "tiktok"
    assert candidate.insights[0].title == "Hot creator hook"
    assert candidate.fallback_used is False


def test_gemini_wrapper_normalizes_list_topic_key_to_string():
    client = FakeClient(
        response_text='{"title":"AI title","content":"AI body","category":"general","topic_key":["creator hook","backup"]}'
    )
    generator = GeminiContentGenerator(
        settings=Settings(
            database_url="sqlite+pysqlite:///:memory:",
            gemini_api_key="test-key",
            gemini_model="gemini-2.5-flash",
        ),
        client=client,
    )

    candidate = generator.generate(build_context(), build_signals())

    assert candidate.topic_key == "creator-hook"


def test_gemini_wrapper_translates_rate_limit_to_domain_error():
    client = FakeClient(error=FakeRateLimitError("rate limit"))
    generator = GeminiContentGenerator(
        settings=Settings(
            database_url="sqlite+pysqlite:///:memory:",
            gemini_api_key="test-key",
            gemini_model="gemini-2.5-flash",
        ),
        client=client,
        rate_limit_error_types=(FakeRateLimitError,),
    )

    with pytest.raises(AutomationQuotaError):
        generator.generate(build_context(), build_signals())


def test_gemini_wrapper_strips_markdown_emphasis_from_text_fields():
    client = FakeClient(
        response_text='{"title":"**AI title**","content":"1. **An Gian** Chieu cao\\n\\n**Goi y** that de thu","category":"general","topic_key":"creator-hook"}'
    )
    generator = GeminiContentGenerator(
        settings=Settings(
            database_url="sqlite+pysqlite:///:memory:",
            gemini_api_key="test-key",
            gemini_model="gemini-2.5-flash",
        ),
        client=client,
    )

    candidate = generator.generate(build_context(), build_signals())

    assert candidate.title == "AI title"
    assert "**" not in candidate.content
