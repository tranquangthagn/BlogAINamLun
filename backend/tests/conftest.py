import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("CRYPTOGRAPHY_OPENSSL_NO_LEGACY", "1")

from app.core.database import Base
from app.core.database import get_db_session
from app.main import create_app
from app.repositories.posts import PostsRepository
from app.services.seed import ensure_seed_data


def create_test_client() -> TestClient:
    return TestClient(create_app())


@pytest.fixture()
def db_engine():
    from app import models  # noqa: F401

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(engine)


@pytest.fixture()
def db_session(db_engine) -> Generator[Session, None, None]:
    testing_session = sessionmaker(bind=db_engine, autoflush=False, autocommit=False, future=True)
    session = testing_session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session) -> Generator[TestClient, None, None]:
    app = create_app()

    def override_get_db_session():
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded_post(db_session):
    ensure_seed_data(db_session)
    return PostsRepository(db_session).list_posts()[0]
