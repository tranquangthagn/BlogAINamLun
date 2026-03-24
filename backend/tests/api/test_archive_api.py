def test_mark_read_endpoint_marks_post(client, seeded_post):
    response = client.post(f"/api/posts/{seeded_post.id}/read")

    assert response.status_code == 200
    assert response.json()["read"] is True
