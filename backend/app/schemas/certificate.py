from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CertificateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    certificate_number: str
    worker_id: str
    module_id: str
    score: int
    status: str
    issued_at: datetime
    expires_at: datetime
    verification_url: str


class VerificationResult(BaseModel):
    """Public response shape for GET /verify/{certificate_number}. Holds
    only what a supervisor needs to make a go/no-go call — no worker
    contact info, no site roster, nothing beyond first name + last initial
    style disclosure is exposed to an anonymous/public caller."""

    found: bool
    result: str  # valid | expired | revoked | not_found
    certificate_number: str
    worker_name: str | None = None
    module_name: str | None = None
    score: int | None = None
    issued_at: datetime | None = None
    expires_at: datetime | None = None
    revoked_reason: str | None = None
    issuer: str = "Jharkhand Safety AR · Training Authority"


class RevokeRequest(BaseModel):
    reason: str
