from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class Certificate(Base, UUIDPk, Timestamped):
    """certificate_number (e.g. JH-FR-2026-00421) is the public identifier —
    it is what the QR code encodes, never the internal UUID `id`, and never
    any personal data. See app.api.v1.verification for what the public
    endpoint returns/withholds."""

    __tablename__ = "certificates"

    certificate_number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    worker_id: Mapped[str] = mapped_column(ForeignKey("workers.id"), nullable=False)
    module_id: Mapped[str] = mapped_column(ForeignKey("training_modules.id"), nullable=False)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("attempts.id"), nullable=False)

    score: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="valid")  # valid|expired|revoked
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    worker: Mapped["Worker"] = relationship()
    module: Mapped["TrainingModule"] = relationship()


class CertificateVerification(Base, UUIDPk, Timestamped):
    """Audit trail of every QR/ID scan against a certificate — who checked
    it (by role, not identity) and what result they were shown."""

    __tablename__ = "certificate_verifications"

    certificate_id: Mapped[str | None] = mapped_column(ForeignKey("certificates.id"), nullable=True)
    scanned_number: Mapped[str] = mapped_column(String(40), nullable=False)
    result: Mapped[str] = mapped_column(String(20), nullable=False)  # valid|expired|revoked|not_found
    verifier_role: Mapped[str] = mapped_column(String(20), nullable=False, default="anonymous")
