import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ.setdefault("CRYPTOGRAPHY_OPENSSL_NO_LEGACY", "1")

from app.core.database import Base
from app.main import create_app


def create_test_client() -> TestClient:
    return TestClient(create_app())


@pytest.fixture()
def db_engine():
    from app import models  # noqa: F401

    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
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
