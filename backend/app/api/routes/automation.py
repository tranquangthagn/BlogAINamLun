from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.schemas.automation import (
    AutomationPreviewResponse,
    AutomationSettingsPayload,
    AutomationSettingsResponse,
)
from app.schemas.posts import PostResponse
from app.services.automation import AutomationService


router = APIRouter(prefix="/automation", tags=["automation"])


@router.get("/settings", response_model=AutomationSettingsResponse)
def get_settings(session: Session = Depends(get_db_session)) -> AutomationSettingsResponse:
    return AutomationService(session).get_settings()


@router.put("/settings", response_model=AutomationSettingsResponse)
def update_settings(
    payload: AutomationSettingsPayload,
    session: Session = Depends(get_db_session),
) -> AutomationSettingsResponse:
    return AutomationService(session).update_settings(payload)


@router.get("/history", response_model=list[AutomationPreviewResponse])
def list_history(session: Session = Depends(get_db_session)) -> list[AutomationPreviewResponse]:
    return AutomationService(session).list_history()


@router.post("/preview", response_model=list[AutomationPreviewResponse])
def preview_candidates(
    payload: AutomationSettingsPayload,
    session: Session = Depends(get_db_session),
) -> list[AutomationPreviewResponse]:
    return AutomationService(session).generate_preview_candidates(payload)


@router.post("/post-now", response_model=PostResponse)
def post_now(session: Session = Depends(get_db_session)) -> PostResponse:
    return AutomationService(session).post_now_from_settings()
