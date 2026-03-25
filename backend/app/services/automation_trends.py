from collections.abc import Iterable
from email.utils import parsedate_to_datetime
from typing import Protocol
from urllib.parse import quote_plus
from xml.etree import ElementTree

import httpx

from app.schemas.automation_generation import TrendRequestContext, TrendSignal
from app.services.automation_images import extract_first_image_url, strip_html_description


SOURCE_PROVIDER_KEYS = {
    "facebook": "social_rss",
    "tiktok": "social_rss",
    "instagram": "social_rss",
    "threads": "social_rss",
    "shopee": "commerce_rss",
}

SOURCE_QUERY_HINTS = {
    "facebook": ["facebook creator trends", "social media trends for women"],
    "tiktok": ["tiktok trends for young women", "creator economy trends girls"],
    "instagram": ["instagram beauty lifestyle trends", "soft girl style trends"],
    "threads": ["threads conversation trends lifestyle", "young women online discussion trends"],
    "shopee": ["shopee shopping trends women", "beauty shopping hacks women"],
}

CATEGORY_QUERY_HINTS = {
    "fashion": [
        "beauty routine trend women 18 25",
        "outfit style trend women 18 25",
        "soft girl fashion trend women",
    ],
    "health": [
        "self care trend women 18 25",
        "wellness habit young women",
        "energy reset sleep hydration women",
    ],
    "tips": [
        "life hacks women 18 25",
        "smart shopping tips women",
        "study work balance tips young women",
    ],
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
            signals.extend(self._parse_feed(context, response.text))
            if len(signals) >= 8:
                break
        return signals

    def _feed_url(self, query: str) -> str:
        return f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=vi&gl=VN&ceid=VN:vi"

    def _parse_feed(self, context: TrendRequestContext, xml_text: str) -> list[TrendSignal]:
        root = ElementTree.fromstring(xml_text)
        items = root.findall(".//item")
        total_items = max(len(items), 1)
        signals: list[TrendSignal] = []

        for index, item in enumerate(items[:6]):
            title = item.findtext("title")
            if not title:
                continue
            raw_description = item.findtext("description")
            url = item.findtext("link")
            published_at = self._parse_pub_date(item.findtext("pubDate"))
            score = round(1 - (index / total_items), 3)
            signals.append(
                TrendSignal(
                    source=context.source,
                    title=title,
                    summary=strip_html_description(raw_description),
                    url=url,
                    image_url=extract_first_image_url(raw_description),
                    category_hint=context.category,
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
    return _queries_for_context(context)


def commerce_query_builder(context: TrendRequestContext) -> list[str]:
    return _queries_for_context(context)


def _queries_for_context(context: TrendRequestContext) -> list[str]:
    source_hints = SOURCE_QUERY_HINTS.get(context.source, [f"{context.source} trend women"])
    category_hints = CATEGORY_QUERY_HINTS.get(context.category, [f"{context.category} trend women 18 25"])
    audience_hint = context.audience_profile

    queries = [
        f"{source_hints[0]} {category_hints[0]} {audience_hint}",
        f"{context.source_label} {context.category} {context.range_label} nữ trẻ",
        f"{category_hints[1]} {source_hints[-1]}",
    ]

    if context.allow_audience_expansion:
        queries.append(f"{context.category} trend women under 30 {context.source}")

    unique_queries: list[str] = []
    for query in queries:
        if query not in unique_queries:
            unique_queries.append(query)

    return unique_queries[:3]
