from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class AuditLog(Base, UUIDPk, Timestamped):
    __tablename__ = "audit_logs"

    actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    actor_role: Mapped[str] = mapped_column(String(20), nullable=False, default="system")
    action: Mapped[str] = mapped_column(String(80), nullable=False)  # e.g. "certificate.revoke"
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
