from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class TrainingProgress(Base, UUIDPk, Timestamped):
    __tablename__ = "training_progress"
    __table_args__ = (UniqueConstraint("worker_id", "module_id", name="uq_worker_module"),)

    worker_id: Mapped[str] = mapped_column(ForeignKey("workers.id"), nullable=False)
    module_id: Mapped[str] = mapped_column(ForeignKey("training_modules.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="not_started")
    progress_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    best_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
