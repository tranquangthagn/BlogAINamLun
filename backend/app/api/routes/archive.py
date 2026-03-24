from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.schemas.archive import PostStateResponse
from app.schemas.posts import PostResponse
from app.services.archive import ArchiveService


router = APIRouter(tags=["archive"])


@router.get("/archive", response_model=list[PostResponse])
def list_archive(
    kind: Literal["saved", "read"] = Query(default="saved"),
    session: Session = Depends(get_db_session),
) -> list[PostResponse]:
    return ArchiveService(session).list_archive(kind=kind)


@router.post("/posts/{post_id}/save", response_model=PostStateResponse)
def save_post(post_id: int, session: Session = Depends(get_db_session)) -> PostStateResponse:
    return ArchiveService(session).save_post(post_id)


@router.delete("/posts/{post_id}/save", response_model=PostStateResponse)
def unsave_post(post_id: int, session: Session = Depends(get_db_session)) -> PostStateResponse:
    return ArchiveService(session).unsave_post(post_id)


@router.post("/posts/{post_id}/read", response_model=PostStateResponse)
def read_post(post_id: int, session: Session = Depends(get_db_session)) -> PostStateResponse:
    return ArchiveService(session).mark_read(post_id)
