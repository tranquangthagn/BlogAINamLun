from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import get_settings
from app.core.database import get_session_factory
from app.core.scheduler import start_scheduler


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        if settings.enable_scheduler:
            application.state.scheduler = start_scheduler(get_session_factory())
        else:
            application.state.scheduler = None
        try:
            yield
        finally:
            scheduler = getattr(application.state, "scheduler", None)
            if scheduler is not None:
                scheduler.shutdown(wait=False)

    application = FastAPI(title=settings.app_name, lifespan=lifespan)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins or ["*"],
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(api_router)
    return application


app = create_app()
