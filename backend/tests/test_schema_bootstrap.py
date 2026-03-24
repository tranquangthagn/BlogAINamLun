import os

from sqlalchemy import inspect

from app.core.database import configure_database_runtime


def test_expected_tables_exist(db_engine):
    inspector = inspect(db_engine)

    assert set(inspector.get_table_names()) >= {
        "posts",
        "post_images",
        "user_post_states",
        "automation_settings",
        "automation_history",
    }


def test_configure_database_runtime_sets_windows_safe_default(monkeypatch):
    monkeypatch.delenv("CRYPTOGRAPHY_OPENSSL_NO_LEGACY", raising=False)

    configure_database_runtime()

    assert os.environ["CRYPTOGRAPHY_OPENSSL_NO_LEGACY"] == "1"
