from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.post import Post


class PostsRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_posts(self) -> list[Post]:
        stmt: Select[tuple[Post]] = (
            select(Post)
            .options(selectinload(Post.images))
            .order_by(Post.created_at.desc(), Post.id.desc())
        )
        return list(self.session.scalars(stmt).all())

    def count_posts(self) -> int:
        return len(self.list_posts())

    def add_post(self, post: Post) -> Post:
        self.session.add(post)
        return post
