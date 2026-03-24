from fastapi import APIRouter
from fastapi import status
from fastapi.responses import JSONResponse

from app.core.database import check_database_connection


router = APIRouter(tags=["system"])


@router.get("/health")
def read_health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready")
def read_health_ready() -> JSONResponse:
    healthy, reason = check_database_connection()
    if healthy:
        return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok", "database": "ok"})

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "degraded",
            "database": "unavailable",
            "reason": reason or "unknown",
        },
    )
