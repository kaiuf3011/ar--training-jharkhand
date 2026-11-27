from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class Worker(Base, UUIDPk, Timestamped):
    """Worker profile. worker_code is the human-facing ID shown on-device
    (e.g. JH-DHN-04821) and is what certificates and QR payloads reference —
    never the internal UUID."""

    __tablename__ = "workers"

    worker_code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_title: Mapped[str] = mapped_column(String(120), nullable=False)
    experience_band: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="en")  # en | hi | sat

    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"), nullable=False)
    site: Mapped["Site"] = relationship(back_populates="workers")

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), unique=True, nullable=True)
    user: Mapped["User | None"] = relationship(back_populates="worker")
