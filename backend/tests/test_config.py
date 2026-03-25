from app.core.config import Settings


def test_settings_default_origins_support_localhost_and_loopback():
    settings = Settings(database_url="sqlite+pysqlite:///:memory:")

    assert settings.cors_origins == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_settings_accepts_single_origin_string():
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        cors_origins="http://localhost:5173",
    )

    assert settings.cors_origins == ["http://localhost:5173"]


def test_settings_accepts_comma_separated_origin_string():
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        cors_origins="http://localhost:5173, http://localhost:4173",
    )

    assert settings.cors_origins == [
        "http://localhost:5173",
        "http://localhost:4173",
    ]


def test_settings_default_to_pragmatic_real_gemini_flash(monkeypatch):
    monkeypatch.delenv("AUTOMATION_PROVIDER_MODE", raising=False)
    monkeypatch.delenv("AUTOMATION_TREND_CACHE_MINUTES", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_MODEL", raising=False)

    settings = Settings(database_url="sqlite+pysqlite:///:memory:")

    assert settings.automation_provider_mode == "pragmatic_real"
    assert settings.gemini_model == "gemini-2.5-flash"
    assert settings.gemini_api_key is None
    assert settings.automation_trend_cache_minutes == 15


def test_settings_accepts_gemini_env_overrides():
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        automation_provider_mode="pragmatic_real",
        gemini_api_key="test-key",
        gemini_model="gemini-2.5-flash",
        automation_trend_cache_minutes=5,
    )

    assert settings.automation_provider_mode == "pragmatic_real"
    assert settings.gemini_api_key == "test-key"
    assert settings.gemini_model == "gemini-2.5-flash"
    assert settings.automation_trend_cache_minutes == 5
