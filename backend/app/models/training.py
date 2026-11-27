from sqlalchemy import JSON, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class TrainingModule(Base, UUIDPk, Timestamped):
    """One of the five safety domains (fire, gas, machinery, electrical,
    ppe). Only `fire` and `gas` ship a runnable scenario in this build."""

    __tablename__ = "training_modules"

    key: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)  # fire | gas | mach | elec | ppe
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")  # draft | published
    certificate_prefix: Mapped[str] = mapped_column(String(10), nullable=False)  # e.g. "FR", "GS"
    validity_days: Mapped[int] = mapped_column(Integer, nullable=False, default=365)
    pass_mark: Mapped[int] = mapped_column(Integer, nullable=False, default=70)


class Scenario(Base, UUIDPk, Timestamped):
    """A versioned, data-driven scenario definition — objectives, hazards,
    interactables, scoring weights, branching events — consumed by whatever
    runtime renders it (browser simulation today; a native AR/VR runtime is
    the same contract, see docs/UNITY_INTEGRATION.md). `config` intentionally
    holds the whole scenario graph as JSON rather than being hard-coded into
    application code, per the "dynamic scenario engine" requirement."""

    __tablename__ = "scenarios"

    module_id: Mapped[str] = mapped_column(ForeignKey("training_modules.id"), nullable=False)
    key: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0.0")
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    module: Mapped["TrainingModule"] = relationship()


class Question(Base, UUIDPk, Timestamped):
    __tablename__ = "questions"

    module_id: Mapped[str] = mapped_column(ForeignKey("training_modules.id"), nullable=False)
    text_en: Mapped[str] = mapped_column(String(500), nullable=False)
    text_hi: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    text_sat: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    options: Mapped[list] = mapped_column(JSON, nullable=False)  # [{en, hi, sat}, ...]
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation_en: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    explanation_hi: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    explanation_sat: Mapped[str] = mapped_column(String(500), nullable=False, default="")
