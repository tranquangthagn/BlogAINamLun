from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.posts import PostsRepository
from app.schemas.posts import PostResponse
from app.services.seed import ensure_seed_data


def format_time_since(value: datetime, now: datetime | None = None) -> str:
    current = now or datetime.now()
    diff_minutes = max(1, int((current - value).total_seconds() // 60))
    if diff_minutes < 60:
        return f"{diff_minutes} phut truoc"

    diff_hours = diff_minutes // 60
    if diff_hours < 24:
        return f"{diff_hours} gio truoc"

    diff_days = diff_hours // 24
    return f"{diff_days} ngay truoc"


class PostsService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = PostsRepository(session)

    def list_feed_posts(self) -> list[PostResponse]:
        ensure_seed_data(self.session)
        return [
            PostResponse(
                id=post.id,
                author=post.author,
                avatar=post.avatar,
                content=post.content,
                images=[image.image_url for image in sorted(post.images, key=lambda item: item.position)],
                time=format_time_since(post.created_at),
                createdAt=post.created_at.isoformat(),
                category=post.category,
                likes=post.likes,
                comments=post.comments,
            )
            for post in self.repository.list_posts()
        ]
