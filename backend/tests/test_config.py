from app.core.config import Settings


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
