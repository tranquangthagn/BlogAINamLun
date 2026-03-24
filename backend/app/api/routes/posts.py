from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.schemas.posts import PostResponse
from app.services.posts import PostsService


router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=list[PostResponse])
def list_posts(session: Session = Depends(get_db_session)) -> list[PostResponse]:
    return PostsService(session).list_feed_posts()
