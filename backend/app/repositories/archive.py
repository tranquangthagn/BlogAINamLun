from datetime import datetime

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.post import Post
from app.models.user_post_state import UserPostState


class ArchiveRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_state_for_post(self, post_id: int) -> UserPostState | None:
        stmt: Select[tuple[UserPostState]] = select(UserPostState).where(UserPostState.post_id == post_id)
        return self.session.scalar(stmt)

    def upsert_saved_state(self, post_id: int, saved: bool) -> UserPostState:
        state = self.get_state_for_post(post_id)
        if state is None:
            state = UserPostState(post_id=post_id, saved=saved, saved_at=datetime.now() if saved else None)
            self.session.add(state)
        else:
            state.saved = saved
            state.saved_at = datetime.now() if saved else None
        return state

    def mark_read(self, post_id: int) -> UserPostState:
        state = self.get_state_for_post(post_id)
        if state is None:
            state = UserPostState(post_id=post_id, read=True, read_at=datetime.now())
            self.session.add(state)
        else:
            state.read = True
            state.read_at = datetime.now()
        return state

    def list_archive_posts(self, kind: str) -> list[Post]:
        stmt: Select[tuple[Post]] = (
            select(Post)
            .join(UserPostState, UserPostState.post_id == Post.id)
            .options(selectinload(Post.images), selectinload(Post.user_state))
        )
        if kind == "read":
            stmt = stmt.where(UserPostState.read.is_(True))
        else:
            stmt = stmt.where(UserPostState.saved.is_(True))

        stmt = stmt.order_by(Post.created_at.desc(), Post.id.desc())
        return list(self.session.scalars(stmt).all())
