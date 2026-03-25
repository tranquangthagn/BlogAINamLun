from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.schemas.automation import (
    AutomationPreviewResponse,
    AutomationSettingsPayload,
    AutomationSettingsResponse,
)
from app.schemas.posts import PostResponse
from app.services.automation import AutomationService
from app.services.automation_gemini import (
    AutomationConfigurationError,
    AutomationGenerationError,
    AutomationQuotaError,
)


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
    try:
        return AutomationService(session).generate_preview_candidates(payload)
    except AutomationQuotaError as exc:
        raise HTTPException(status_code=503, detail="AUTOMATION_QUOTA_EXCEEDED") from exc
    except AutomationConfigurationError as exc:
        raise HTTPException(status_code=503, detail="AUTOMATION_NOT_CONFIGURED") from exc
    except AutomationGenerationError as exc:
        raise HTTPException(status_code=502, detail="AUTOMATION_GENERATION_FAILED") from exc


@router.post("/post-now", response_model=PostResponse)
def post_now(session: Session = Depends(get_db_session)) -> PostResponse:
    try:
        return AutomationService(session).post_now_from_settings()
    except AutomationQuotaError as exc:
        raise HTTPException(status_code=503, detail="AUTOMATION_QUOTA_EXCEEDED") from exc
    except AutomationConfigurationError as exc:
        raise HTTPException(status_code=503, detail="AUTOMATION_NOT_CONFIGURED") from exc
    except AutomationGenerationError as exc:
        raise HTTPException(status_code=502, detail="AUTOMATION_GENERATION_FAILED") from exc
