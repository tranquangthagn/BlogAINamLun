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
    assert response.json()["tone"] == "trung_tinh"
    assert response.json()["focusPrompt"] == ""


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


def test_post_now_returns_soft_failure_when_gemini_quota_is_exhausted(client, monkeypatch):
    def raise_quota(self):
        raise AutomationQuotaError("quota")

    monkeypatch.setattr(AutomationService, "post_now_from_settings", raise_quota)

    response = client.post("/api/automation/post-now")

    assert response.status_code == 503
    assert response.json()["detail"] == "AUTOMATION_QUOTA_EXCEEDED"
