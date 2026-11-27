from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class SyncRecord(Base, UUIDPk, Timestamped):
    """One offline-queued record submitted for sync. `client_id` is minted
    on-device and is the idempotency key: replaying the same batch (e.g.
    after a dropped connection) must be a no-op the second time, so
    app.services.sync_service upserts on client_id, never inserts blind."""

    __tablename__ = "sync_records"

    client_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    worker_id: Mapped[str | None] = mapped_column(ForeignKey("workers.id"), nullable=True)
    record_type: Mapped[str] = mapped_column(String(40), nullable=False)  # attempt | profile_update | ...
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending|applied|failed
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
