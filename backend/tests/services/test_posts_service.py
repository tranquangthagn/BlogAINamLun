from app.repositories.posts import PostsRepository
from app.services.seed import ensure_seed_data


def test_seed_posts_are_inserted_only_once(db_session):
    ensure_seed_data(db_session)
    ensure_seed_data(db_session)

    posts = PostsRepository(db_session).list_posts()

    assert len(posts) >= 4
    assert {post.source_type for post in posts} == {"seeded"}
