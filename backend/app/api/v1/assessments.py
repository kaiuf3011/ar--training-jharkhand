from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.assessment import AttemptOut, AttemptSubmit
from app.schemas.certificate import CertificateOut
from app.services import certificate_service, sync_service

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("/submit", response_model=AttemptOut)
def submit_attempt(body: AttemptSubmit, db: Session = Depends(get_db)):
    """Submit one completed attempt while online. Offline attempts use the
    identical apply_attempt() path via POST /sync/batch — see that route
    for the batched/idempotent-replay version of this same call."""
    try:
        attempt, _cert, _dup = sync_service.apply_attempt(db, body)
    except sync_service.AttemptError as e:
        raise HTTPException(e.status_code, e.detail)
    return attempt


@router.get("/{client_attempt_id}/certificate", response_model=CertificateOut | None)
def get_attempt_certificate(client_attempt_id: str, db: Session = Depends(get_db)):
    from app.models.assessment import Attempt
    from app.models.certificate import Certificate

    attempt = db.query(Attempt).filter_by(client_attempt_id=client_attempt_id).first()
    if attempt is None:
        raise HTTPException(404, "Attempt not found")
    cert = db.query(Certificate).filter_by(attempt_id=attempt.id).first()
    if cert is None:
        return None
    return CertificateOut(
        **{k: getattr(cert, k) for k in ("id", "certificate_number", "worker_id", "module_id", "score", "status", "issued_at", "expires_at")},
        verification_url=certificate_service.verification_url(cert.certificate_number),
    )
