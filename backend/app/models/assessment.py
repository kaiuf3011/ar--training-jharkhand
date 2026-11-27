from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class Attempt(Base, UUIDPk, Timestamped):
    """One assessment attempt at one module. `client_attempt_id` is a
    UUID minted on-device at attempt start and is the idempotency key for
    offline sync — replaying the same sync payload twice must not create a
    duplicate attempt (see app.services.sync_service)."""

    __tablename__ = "attempts"

    client_attempt_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)
    worker_id: Mapped[str] = mapped_column(ForeignKey("workers.id"), nullable=False)
    module_id: Mapped[str] = mapped_column(ForeignKey("training_modules.id"), nullable=False)
    scenario_id: Mapped[str | None] = mapped_column(ForeignKey("scenarios.id"), nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="in_progress")  # in_progress|passed|failed
    knowledge_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)   # /30
    ar_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)          # /40
    procedure_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)   # /20
    time_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)        # /10
    total_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)       # /100
    elapsed_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    synced_from_offline: Mapped[bool] = mapped_column(default=False, nullable=False)

    worker: Mapped["Worker"] = relationship()
    module: Mapped["TrainingModule"] = relationship()
    actions: Mapped[list["Action"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")


class Action(Base, UUIDPk, Timestamped):
    """One logged practical AR action inside an attempt — mirrors what the
    AR runtime already tracks client-side (key, tries, violations,
    reasons) so the competency engine has the same granularity server-side."""

    __tablename__ = "actions"

    attempt_id: Mapped[str] = mapped_column(ForeignKey("attempts.id"), nullable=False)
    key: Mapped[str] = mapped_column(String(60), nullable=False)   # e.g. "hazard", "ext", "route", "ppe"
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    tries: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    violations: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    correct: Mapped[bool] = mapped_column(nullable=False, default=False)
    reasons: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    attempt: Mapped["Attempt"] = relationship(back_populates="actions")


COMPETENCY_DIMENSIONS = (
    "hazard_recognition",
    "ppe_selection",
    "decision_making",
    "evacuation",
    "response_time",
    "procedure_compliance",
)


class CompetencyScore(Base, UUIDPk, Timestamped):
    """Per-worker, per-dimension rolling competency score (0-100), updated
    after every attempt. This is what the adaptive engine reads to decide
    which scenario variant/emphasis to serve next — see
    app.services.competency_service.recommend_focus()."""

    __tablename__ = "competency_scores"

    worker_id: Mapped[str] = mapped_column(ForeignKey("workers.id"), nullable=False)
    module_id: Mapped[str] = mapped_column(ForeignKey("training_modules.id"), nullable=False)
    dimension: Mapped[str] = mapped_column(String(40), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
