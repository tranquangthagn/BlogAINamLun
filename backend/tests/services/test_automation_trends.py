from app.schemas.automation_generation import TrendRequestContext, TrendSignal
from app.services.automation_trends import AutomationTrendCoordinator, TrendProviderRegistry


def test_trend_signal_supports_minimal_normalized_shape():
    signal = TrendSignal(source="tiktok", title="Hot creator hook", score=0.9)

    assert signal.source == "tiktok"
    assert signal.title == "Hot creator hook"
    assert signal.score == 0.9


def test_trend_request_context_tracks_source_and_range_preferences():
    context = TrendRequestContext(
        sources=["shopee"],
        source_label="Shopee",
        trend_range_mode="week",
        range_label="7 ngay gan day",
    )

    assert context.sources == ["shopee"]
    assert context.range_label == "7 ngay gan day"


class StubTrendProvider:
    def __init__(self, provider_key, signals):
        self.provider_key = provider_key
        self._signals = signals

    def fetch_signals(self, context):
        return list(self._signals)


def test_registry_maps_tiktok_to_social_style_trends():
    social_provider = StubTrendProvider("social_rss", [])
    commerce_provider = StubTrendProvider("commerce_rss", [])
    registry = TrendProviderRegistry(
        providers={
            "social_rss": social_provider,
            "commerce_rss": commerce_provider,
        }
    )

    provider = registry.provider_for_sources(["tiktok", "threads"])

    assert provider.provider_key == "social_rss"


def test_collect_trends_returns_normalized_signals_sorted_by_score():
    context = TrendRequestContext(
        sources=["shopee"],
        source_label="Shopee",
        trend_range_mode="week",
        range_label="7 ngay gan day",
    )
    provider = StubTrendProvider(
        "commerce_rss",
        [
            TrendSignal(source="shopee", title="Second signal", score=0.4),
            TrendSignal(source="shopee", title="Top shopping trend", score=0.9),
            TrendSignal(source="shopee", title="Third signal", score=0.1),
        ],
    )
    coordinator = AutomationTrendCoordinator(
        registry=TrendProviderRegistry(providers={"commerce_rss": provider}),
        max_signals=2,
    )

    signals = coordinator.collect(context)

    assert [signal.title for signal in signals] == [
        "Top shopping trend",
        "Second signal",
    ]
