import app.main as main_module
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.config import get_settings


def test_health_endpoint_returns_ok():
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_startup_skips_session_factory_when_scheduler_disabled(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("ENABLE_SCHEDULER", "false")

    def fail_if_called():
        raise AssertionError("session factory should not be created when scheduler is disabled")

    monkeypatch.setattr(main_module, "get_session_factory", fail_if_called)

    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
