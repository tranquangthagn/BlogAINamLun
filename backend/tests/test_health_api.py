import app.api.routes.health as health_module
import app.main as main_module
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app


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


def test_ready_endpoint_returns_ok_when_database_check_passes(monkeypatch):
    monkeypatch.setattr(health_module, "check_database_connection", lambda: (True, None))

    with TestClient(create_app()) as client:
        response = client.get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_ready_endpoint_returns_503_when_database_check_fails(monkeypatch):
    monkeypatch.setattr(health_module, "check_database_connection", lambda: (False, "db_unreachable"))

    with TestClient(create_app()) as client:
        response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "status": "degraded",
        "database": "unavailable",
        "reason": "db_unreachable",
    }


def test_cors_allows_loopback_dev_origins_on_dynamic_vite_ports():
    client = TestClient(create_app())

    response = client.options(
        "/api/automation/settings",
        headers={
            "Origin": "http://127.0.0.1:5174",
            "Access-Control-Request-Method": "PUT",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5174"
