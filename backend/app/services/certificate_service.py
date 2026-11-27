from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.certificate import Certificate, CertificateVerification
from app.models.training import TrainingModule
from app.utils.dt import as_aware_utc


def issue_certificate(
    db: Session, *, worker_id: str, module: TrainingModule, attempt_id: str, score: int
) -> Certificate:
    """Mint a certificate with a globally-unique, human-readable number
    (JH-{PREFIX}-{YEAR}-{5-digit sequence}). Retries on the rare collision
    under concurrent issuance rather than trusting a precomputed count."""
    now = datetime.now(timezone.utc)
    year = now.year
    for _ in range(5):
        seq = (
            db.query(Certificate)
            .filter(Certificate.certificate_number.like(f"JH-{module.certificate_prefix}-{year}-%"))
            .count()
            + 1
        )
        number = f"JH-{module.certificate_prefix}-{year}-{seq:05d}"
        cert = Certificate(
            certificate_number=number,
            worker_id=worker_id,
            module_id=module.id,
            attempt_id=attempt_id,
            score=score,
            status="valid",
            issued_at=now,
            expires_at=now + timedelta(days=module.validity_days),
        )
        db.add(cert)
        try:
            db.flush()
            return cert
        except IntegrityError:
            db.rollback()
    raise RuntimeError("Could not allocate a unique certificate number after 5 attempts")


def verification_url(certificate_number: str) -> str:
    settings = get_settings()
    return f"{settings.PUBLIC_BASE_URL}/verify/{certificate_number}"


def effective_status(cert: Certificate) -> str:
    """Expiry is computed, not stored as a cron-updated flag — a certificate
    is "expired" the instant `now` passes `expires_at`, whether or not
    anything has run since."""
    if cert.status == "revoked":
        return "revoked"
    if as_aware_utc(cert.expires_at) <= datetime.now(timezone.utc):
        return "expired"
    return "valid"


def record_verification(db: Session, *, certificate: Certificate | None, scanned_number: str, result: str, verifier_role: str) -> None:
    db.add(
        CertificateVerification(
            certificate_id=certificate.id if certificate else None,
            scanned_number=scanned_number,
            result=result,
            verifier_role=verifier_role,
        )
    )
