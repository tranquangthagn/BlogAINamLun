from datetime import datetime

from app.repositories.posts import PostsRepository
from app.services.seed import ensure_seed_data
from app.services.posts import format_time_since


def test_seed_posts_are_inserted_only_once(db_session):
    ensure_seed_data(db_session)
    ensure_seed_data(db_session)

    posts = PostsRepository(db_session).list_posts()

    assert len(posts) >= 4
    assert {post.source_type for post in posts} == {"seeded"}


def test_seed_posts_use_readable_vietnamese_copy(db_session):
    ensure_seed_data(db_session)

    posts = PostsRepository(db_session).list_posts()
    contents = {post.content for post in posts}
    authors = {post.author for post in posts}

    assert "Cậu Chủ" in authors
    assert any("Bộ sưu tập thời trang mùa hè" in content for content in contents)
    assert any("mẹo nhỏ giúp bàn phím luôn sạch bóng" in content.lower() for content in contents)


def test_seed_posts_are_synchronized_when_existing_copy_is_outdated(db_session):
    ensure_seed_data(db_session)
    post = PostsRepository(db_session).list_posts()[0]
    post.author = "Cau Chu"
    post.content = "Bo suu tap thoi trang"
    db_session.commit()

    ensure_seed_data(db_session)

    refreshed_post = PostsRepository(db_session).list_posts()[0]
    assert refreshed_post.author == "Cậu Chủ"
    assert "Bộ sưu tập" in refreshed_post.content


def test_format_time_since_returns_vietnamese_labels():
    now = datetime.fromisoformat("2026-03-24T12:00:00")

    assert format_time_since(datetime.fromisoformat("2026-03-24T11:55:00"), now=now) == "5 phút trước"
    assert format_time_since(datetime.fromisoformat("2026-03-24T09:00:00"), now=now) == "3 giờ trước"
    assert format_time_since(datetime.fromisoformat("2026-03-21T12:00:00"), now=now) == "3 ngày trước"
