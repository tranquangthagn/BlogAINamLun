from fastapi import APIRouter

from app.api.routes.archive import router as archive_router
from app.api.routes.automation import router as automation_router
from app.api.routes.health import router as health_router
from app.api.routes.posts import router as posts_router
from app.core.config import get_settings


router = APIRouter()
settings = get_settings()

router.include_router(health_router)
router.include_router(posts_router, prefix=settings.api_v1_prefix)
router.include_router(archive_router, prefix=settings.api_v1_prefix)
router.include_router(automation_router, prefix=settings.api_v1_prefix)
