from app.services.automation import AutomationService
from app.services.automation_gemini import AutomationConfigurationError, AutomationQuotaError


def test_put_settings_persists_mysql_backed_configuration(client, automation_settings_payload):
    response = client.put("/api/automation/settings", json=automation_settings_payload)

    assert response.status_code == 200
    assert response.json()["enabled"] is True
    assert response.json()["tone"] == "gan_gui"
    assert response.json()["focusPrompt"] == "uu tien goc nhin cho nguoi moi bat dau"


def test_get_settings_returns_light_generation_control_defaults(client):
    response = client.get("/api/automation/settings")

    assert response.status_code == 200
    assert response.json()["tone"] == "gan_gui"
    assert response.json()["focusPrompt"] == ""


def test_preview_returns_batch_grouped_items(client, automation_settings_payload, monkeypatch):
    class PreviewStubService:
        def __init__(self, session):
            self.session = session

        def generate_preview_candidates(self, payload):
            return {
                "batchId": "batch-123",
                "items": [
                    {
                        "id": 11,
                        "batchId": "batch-123",
                        "title": "Bài thời trang",
                        "content": "Nội dung có dấu",
                        "source": "tiktok",
                        "topicKey": "fashion-post",
                        "createdAt": "2026-03-25T10:00:00",
                        "posted": False,
                        "category": "fashion",
                        "status": "preview",
                        "failureReason": None,
                        "images": ["https://example.com/fashion.jpg"],
                        "insights": [],
                    }
                ],
            }

    monkeypatch.setattr("app.api.routes.automation.AutomationService", PreviewStubService)

    response = client.post("/api/automation/preview", json=automation_settings_payload)

    assert response.status_code == 200
    assert response.json()["batchId"] == "batch-123"
    assert response.json()["items"][0]["category"] == "fashion"
    assert response.json()["items"][0]["images"] == ["https://example.com/fashion.jpg"]


def test_preview_returns_soft_failure_when_gemini_quota_is_exhausted(client, automation_settings_payload, monkeypatch):
    def raise_quota(self, payload):
        raise AutomationQuotaError("quota")

    monkeypatch.setattr(AutomationService, "generate_preview_candidates", raise_quota)

    response = client.post("/api/automation/preview", json=automation_settings_payload)

    assert response.status_code == 503
    assert response.json()["detail"] == "AUTOMATION_QUOTA_EXCEEDED"


def test_preview_returns_configuration_code_when_gemini_key_is_missing(
    client,
    automation_settings_payload,
    monkeypatch,
):
    def raise_config(self, payload):
        raise AutomationConfigurationError("missing key")

    monkeypatch.setattr(AutomationService, "generate_preview_candidates", raise_config)

    response = client.post("/api/automation/preview", json=automation_settings_payload)

    assert response.status_code == 503
    assert response.json()["detail"] == "AUTOMATION_NOT_CONFIGURED"


def test_post_now_returns_batch_receipt(client, monkeypatch):
    class QueueStubService:
        def __init__(self, session):
            self.session = session

        def post_now_from_settings(self):
            return {
                "batchId": "batch-queued",
                "queuedCount": 6,
                "mode": "queued",
            }

    monkeypatch.setattr("app.api.routes.automation.AutomationService", QueueStubService)

    response = client.post("/api/automation/post-now")

    assert response.status_code == 200
    assert response.json() == {
        "batchId": "batch-queued",
        "queuedCount": 6,
        "mode": "queued",
    }


def test_post_now_returns_soft_failure_when_gemini_quota_is_exhausted(client, monkeypatch):
    def raise_quota(self):
        raise AutomationQuotaError("quota")

    monkeypatch.setattr(AutomationService, "post_now_from_settings", raise_quota)

    response = client.post("/api/automation/post-now")

    assert response.status_code == 503
    assert response.json()["detail"] == "AUTOMATION_QUOTA_EXCEEDED"
