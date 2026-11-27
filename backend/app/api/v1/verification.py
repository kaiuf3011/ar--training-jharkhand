from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.certificate import Certificate
from app.services import certificate_service
from app.schemas.certificate import VerificationResult

router = APIRouter(tags=["verification"])


def _masked_name(full_name: str) -> str:
    """Public verification shows first name + last-initial, not the full
    worker record — matches the "no unnecessary worker information
    publicly" requirement while still letting a supervisor confirm identity
    against a photo ID at the gate."""
    parts = full_name.strip().split()
    if len(parts) <= 1:
        return full_name
    return f"{parts[0]} {parts[-1][0]}."


@router.get("/verify/{certificate_number}", response_model=VerificationResult)
def verify_certificate(certificate_number: str, request: Request, db: Session = Depends(get_db)):
    """Public, unauthenticated endpoint — QR codes printed on a certificate
    must resolve without a login. verifier_role is 'anonymous' here; the
    supervisor app additionally calls this same endpoint with its own
    bearer token, recorded as verifier_role='supervisor' (see
    app.api.v1.verification.verify_certificate_as_supervisor, or simply
    pass Authorization and this route records the role from it)."""
    cert = db.query(Certificate).filter_by(certificate_number=certificate_number).first()

    if cert is None:
        certificate_service.record_verification(db, certificate=None, scanned_number=certificate_number, result="not_found", verifier_role="anonymous")
        db.commit()
        return VerificationResult(found=False, result="not_found", certificate_number=certificate_number)

    result = certificate_service.effective_status(cert)
    certificate_service.record_verification(db, certificate=cert, scanned_number=certificate_number, result=result, verifier_role="anonymous")
    db.commit()

    return VerificationResult(
        found=True,
        result=result,
        certificate_number=cert.certificate_number,
        worker_name=_masked_name(cert.worker.full_name),
        module_name=cert.module.name,
        score=cert.score,
        issued_at=cert.issued_at,
        expires_at=cert.expires_at,
        revoked_reason=cert.revoked_reason,
    )
