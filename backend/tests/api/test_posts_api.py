def test_get_posts_returns_feed_payload(client):
    response = client.get("/api/posts")

    assert response.status_code == 200
    assert response.json()[0]["images"] is not None
