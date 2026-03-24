def test_get_posts_returns_feed_payload(client):
    response = client.get("/api/posts")

    assert response.status_code == 200
    assert response.json()[0]["images"] is not None


def test_get_posts_returns_readable_vietnamese_fields(client):
    response = client.get("/api/posts")

    assert response.status_code == 200
    payload = response.json()

    assert any(post["author"] == "Cậu Chủ" for post in payload)
    assert any("Bộ sưu tập thời trang mùa hè" in post["content"] for post in payload)
    assert any("trước" in post["time"] for post in payload)
