from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.archive import ArchiveRepository
from app.repositories.posts import PostsRepository
from app.schemas.archive import PostStateResponse
from app.schemas.posts import PostResponse
from app.services.posts import serialize_post
from app.services.seed import ensure_seed_data


class ArchiveService:
    def __init__(self, session: Session):
        self.session = session
        self.posts_repository = PostsRepository(session)
        self.archive_repository = ArchiveRepository(session)

    def _require_post(self, post_id: int):
        ensure_seed_data(self.session)
        post = self.posts_repository.get_post(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        return post

    def save_post(self, post_id: int) -> PostStateResponse:
        self._require_post(post_id)
        state = self.archive_repository.upsert_saved_state(post_id, saved=True)
        self.session.commit()
        return PostStateResponse(post_id=post_id, saved=state.saved, read=state.read)

    def unsave_post(self, post_id: int) -> PostStateResponse:
        self._require_post(post_id)
        state = self.archive_repository.upsert_saved_state(post_id, saved=False)
        self.session.commit()
        return PostStateResponse(post_id=post_id, saved=state.saved, read=state.read)

    def mark_read(self, post_id: int) -> PostStateResponse:
        self._require_post(post_id)
        state = self.archive_repository.mark_read(post_id)
        self.session.commit()
        return PostStateResponse(post_id=post_id, saved=state.saved, read=state.read)

    def list_archive(self, kind: str = "saved") -> list[PostResponse]:
        ensure_seed_data(self.session)
        posts = self.archive_repository.list_archive_posts(kind)
        return [serialize_post(post) for post in posts]
