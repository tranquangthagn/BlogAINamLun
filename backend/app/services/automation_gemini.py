import json
import re

from google import genai
from google.genai.errors import APIError

from app.core.config import Settings, get_settings
from app.schemas.automation_generation import (
    GeneratedCandidate,
    GenerationDiagnostics,
    TrendRequestContext,
    TrendSignal,
)
from app.services.automation_prompts import build_generation_prompt


class AutomationGenerationError(RuntimeError):
    pass


class AutomationConfigurationError(AutomationGenerationError):
    pass


class AutomationQuotaError(AutomationGenerationError):
    pass


class GeminiContentGenerator:
    def __init__(
        self,
        settings: Settings | None = None,
        client=None,
        rate_limit_error_types: tuple[type[BaseException], ...] = (),
    ):
        self.settings = settings or get_settings()
        self.client = client
        self.rate_limit_error_types = rate_limit_error_types

    def generate(
        self,
        context: TrendRequestContext,
        signals: list[TrendSignal],
    ) -> GeneratedCandidate:
        if not self.settings.gemini_api_key:
            raise AutomationConfigurationError("Gemini API key is not configured")
        if not signals:
            raise AutomationGenerationError("No trend signals available for generation")

        prompt = build_generation_prompt(context, signals)
        client = self.client or genai.Client(api_key=self.settings.gemini_api_key)

        try:
            response = client.models.generate_content(
                model=self.settings.gemini_model,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
        except self.rate_limit_error_types as exc:
            raise AutomationQuotaError("Gemini quota exceeded") from exc
        except APIError as exc:
            if getattr(exc, "code", None) == 429:
                raise AutomationQuotaError("Gemini quota exceeded") from exc
            raise AutomationGenerationError("Gemini generation failed") from exc
        except Exception as exc:
            raise AutomationGenerationError("Gemini generation failed") from exc

        try:
            payload = json.loads(response.text)
            return GeneratedCandidate(
                title=self._coerce_text(payload.get("title"), fallback="Untitled automation draft"),
                content=self._coerce_text(payload.get("content"), fallback=""),
                source=context.sources[0],
                category=self._coerce_text(payload.get("category"), fallback="general"),
                topic_key=self._coerce_topic_key(payload.get("topic_key"), default=context.sources[0]),
                fallback_used=False,
                diagnostics=GenerationDiagnostics(
                    provider_mode=self.settings.automation_provider_mode,
                    generator_model=self.settings.gemini_model,
                    fallback_reason=None,
                ),
            )
        except (KeyError, TypeError, json.JSONDecodeError) as exc:
            raise AutomationGenerationError("Gemini returned malformed output") from exc

    def _coerce_text(self, value, fallback: str) -> str:
        if isinstance(value, str) and value.strip():
            return value.strip()
        return fallback

    def _coerce_topic_key(self, value, default: str) -> str:
        if isinstance(value, str):
            candidate = value
        elif isinstance(value, list):
            candidate = next((item for item in value if isinstance(item, str) and item.strip()), default)
        else:
            candidate = default
        return self._slugify(candidate, fallback=default)

    def _slugify(self, value: str, fallback: str) -> str:
        normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
        if normalized:
            return normalized
        return re.sub(r"[^a-z0-9]+", "-", fallback.lower()).strip("-") or "automation"
