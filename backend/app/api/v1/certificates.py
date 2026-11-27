from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.certificate import Certificate
from app.schemas.certificate import CertificateOut, RevokeRequest
from app.services import certificate_service

router = APIRouter(prefix="/certificates", tags=["certificates"])


def _to_out(cert: Certificate) -> CertificateOut:
    return CertificateOut(
        id=cert.id,
        certificate_number=cert.certificate_number,
        worker_id=cert.worker_id,
        module_id=cert.module_id,
        score=cert.score,
        status=certificate_service.effective_status(cert),
        issued_at=cert.issued_at,
        expires_at=cert.expires_at,
        verification_url=certificate_service.verification_url(cert.certificate_number),
    )


@router.get("", response_model=list[CertificateOut])
def list_certificates(
    db: Session = Depends(get_db),
    worker_id: str | None = None,
    status: str | None = None,
    _admin=Depends(require_admin),
):
    q = db.query(Certificate)
    if worker_id:
        q = q.filter_by(worker_id=worker_id)
    rows = [c for c in q.order_by(Certificate.issued_at.desc()).all()]
    out = [_to_out(c) for c in rows]
    if status:
        out = [c for c in out if c.status == status]
    return out


@router.post("/{certificate_number}/revoke", response_model=CertificateOut)
def revoke_certificate(certificate_number: str, body: RevokeRequest, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    cert = db.query(Certificate).filter_by(certificate_number=certificate_number).first()
    if cert is None:
        raise HTTPException(404, "Certificate not found")
    cert.status = "revoked"
    cert.revoked_at = datetime.now(timezone.utc)
    cert.revoked_reason = body.reason
    db.commit()
    db.refresh(cert)
    return _to_out(cert)
