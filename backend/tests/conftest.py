"""
Every test gets its own fresh, isolated SQLite database (file-per-test,
deleted on teardown) — never the dev.db a developer might be poking at,
and never shared state between tests.
"""
import os
import tempfile
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 — populate Base.metadata
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.site import Site
from app.models.training import Question, Scenario, TrainingModule
from app.models.user import User, UserRole
from app.models.worker import Worker


@pytest.fixture()
def db_session():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    session = TestingSessionLocal()
    yield session
    session.close()
    app.dependency_overrides.clear()
    engine.dispose()
    os.unlink(path)


@pytest.fixture()
def client(db_session):
    return TestClient(app)


@pytest.fixture()
def seeded(db_session):
    """A minimal but realistic fixture set: one site, the fire + gas
    modules with their real 3-question banks and pass_mark, one scenario
    each, one worker, one admin user."""
    site = Site(name="Dhanbad Mine", site_type="Coal mining", district="Dhanbad")
    db_session.add(site)
    db_session.flush()

    fire = TrainingModule(key="fire", name="Fire & Explosion Response", status="published", certificate_prefix="FR", validity_days=365, pass_mark=70)
    gas = TrainingModule(key="gas", name="Gas Leak & Confined Space", status="published", certificate_prefix="GS", validity_days=365, pass_mark=70)
    db_session.add_all([fire, gas])
    db_session.flush()

    fire_questions = [
        ("Which extinguisher for an energized electrical fire?", ["CO2", "Water", "Foam", "Sand"], 0),
        ("What do you do first on discovering a fire?", ["Ignore it", "Raise the alarm", "Open windows", "Keep working"], 1),
        ("During evacuation you should...", ["Use the lift", "Go back for tools", "Use the nearest safe exit", "Wait"], 2),
    ]
    for text, opts, correct in fire_questions:
        db_session.add(Question(module_id=fire.id, text_en=text, options=[{"en": o} for o in opts], correct_index=correct))

    gas_questions = [
        ("Safe oxygen range for confined-space entry?", ["15-19%", "19.5-23.5%", "10-15%", "Above 25%"], 1),
        ("Before entering a confined space you must have...", ["A helmet only", "Verbal OK", "A permit and gas test", "Nothing"], 2),
        ("Your buddy collapses inside. You should...", ["Alert and wait for SCBA team", "Enter immediately", "Wait", "Pour water"], 0),
    ]
    for text, opts, correct in gas_questions:
        db_session.add(Question(module_id=gas.id, text_en=text, options=[{"en": o} for o in opts], correct_index=correct))

    db_session.add(Scenario(module_id=fire.id, key="fire_mcc3", title="Electrical Fire", config={}))
    db_session.add(Scenario(module_id=gas.id, key="gas_cs07", title="Gas Leak", config={}))

    worker = Worker(worker_code="JH-DHN-00001", full_name="Test Worker", role_title="Operator", site_id=site.id)
    db_session.add(worker)

    admin = User(email="admin@example.com", password_hash=hash_password("Passw0rd!"), role=UserRole.ADMIN, display_name="Admin")
    db_session.add(admin)

    db_session.commit()
    return {"site": site, "fire": fire, "gas": gas, "worker": worker, "admin": admin}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
