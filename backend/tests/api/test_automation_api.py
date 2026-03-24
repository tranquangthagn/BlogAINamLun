def test_put_settings_persists_mysql_backed_configuration(client, automation_settings_payload):
    response = client.put("/api/automation/settings", json=automation_settings_payload)

    assert response.status_code == 200
    assert response.json()["enabled"] is True
