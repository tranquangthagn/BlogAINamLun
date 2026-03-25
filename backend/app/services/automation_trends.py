from collections.abc import Iterable
from email.utils import parsedate_to_datetime
from typing import Protocol
from urllib.parse import quote_plus
from xml.etree import ElementTree

import httpx

from app.schemas.automation_generation import TrendRequestContext, TrendSignal


SOCIAL_SOURCES = {"facebook", "tiktok", "instagram", "threads"}
COMMERCE_SOURCES = {"shopee"}

SOURCE_PROVIDER_KEYS = {
    "facebook": "social_rss",
    "tiktok": "social_rss",
    "instagram": "social_rss",
    "threads": "social_rss",
    "shopee": "commerce_rss",
}

SOURCE_QUERY_HINTS = {
    "facebook": ["social media marketing trends", "facebook creator trends"],
    "tiktok": ["tiktok trends", "creator economy trends"],
    "instagram": ["instagram trends", "lifestyle creator trends"],
    "threads": ["social conversation trends", "creator discourse trends"],
    "shopee": ["ecommerce product trends", "shopping consumer trends"],
}


class TrendProvider(Protocol):
    provider_key: str

    def fetch_signals(self, context: TrendRequestContext) -> list[TrendSignal]:
        ...


class GoogleNewsRssTrendProvider:
    def __init__(self, provider_key: str, query_builder, client: httpx.Client | None = None):
        self.provider_key = provider_key
        self.query_builder = query_builder
        self.client = client or httpx.Client(timeout=10.0, follow_redirects=True)

    def fetch_signals(self, context: TrendRequestContext) -> list[TrendSignal]:
        signals: list[TrendSignal] = []
        for query in self.query_builder(context):
            response = self.client.get(self._feed_url(query))
            response.raise_for_status()
            signals.extend(self._parse_feed(context.sources[0], response.text))
            if len(signals) >= 8:
                break
        return signals

    def _feed_url(self, query: str) -> str:
        return f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=vi&gl=VN&ceid=VN:vi"

    def _parse_feed(self, source: str, xml_text: str) -> list[TrendSignal]:
        root = ElementTree.fromstring(xml_text)
        items = root.findall(".//item")
        signals: list[TrendSignal] = []
        total_items = max(len(items), 1)
        for index, item in enumerate(items[:5]):
            title = item.findtext("title")
            if not title:
                continue
            description = item.findtext("description")
            url = item.findtext("link")
            published_at = self._parse_pub_date(item.findtext("pubDate"))
            score = round(1 - (index / total_items), 3)
            signals.append(
                TrendSignal(
                    source=source,
                    title=title,
                    summary=description,
                    url=url,
                    category_hint=self._category_hint_for_source(source),
                    published_at=published_at,
                    score=score,
                )
            )
        return signals

    def _parse_pub_date(self, raw_value: str | None):
        if not raw_value:
            return None
        try:
            return parsedate_to_datetime(raw_value)
        except (TypeError, ValueError, IndexError):
            return None

    def _category_hint_for_source(self, source: str) -> str:
        if source in COMMERCE_SOURCES:
            return "tips"
        return "general"


class TrendProviderRegistry:
    def __init__(self, providers: dict[str, TrendProvider] | None = None):
        self.providers = providers or self._default_providers()

    def provider_for_sources(self, sources: Iterable[str]) -> TrendProvider:
        for source in sources:
            provider_key = SOURCE_PROVIDER_KEYS.get(source, "social_rss")
            provider = self.providers.get(provider_key)
            if provider is not None:
                return provider
        raise ValueError("No trend provider configured for the requested sources")

    def _default_providers(self) -> dict[str, TrendProvider]:
        return {
            "social_rss": GoogleNewsRssTrendProvider("social_rss", social_query_builder),
            "commerce_rss": GoogleNewsRssTrendProvider("commerce_rss", commerce_query_builder),
        }


class AutomationTrendCoordinator:
    def __init__(self, registry: TrendProviderRegistry | None = None, max_signals: int = 3):
        self.registry = registry or TrendProviderRegistry()
        self.max_signals = max_signals

    def collect(self, context: TrendRequestContext) -> list[TrendSignal]:
        provider = self.registry.provider_for_sources(context.sources)
        normalized = provider.fetch_signals(context)
        sorted_signals = sorted(normalized, key=lambda signal: signal.score, reverse=True)
        return sorted_signals[: self.max_signals]


def social_query_builder(context: TrendRequestContext) -> list[str]:
    return _query_hints_for_context(context)


def commerce_query_builder(context: TrendRequestContext) -> list[str]:
    return _query_hints_for_context(context)


def _query_hints_for_context(context: TrendRequestContext) -> list[str]:
    hints: list[str] = []
    for source in context.sources:
        hints.extend(SOURCE_QUERY_HINTS.get(source, [f"{source} trends"]))
    hints.append(f"{context.source_label} {context.range_label}")
    return hints[:2]
