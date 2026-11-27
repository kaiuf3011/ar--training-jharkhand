from pydantic import BaseModel

from app.schemas.assessment import AttemptSubmit


class SyncBatchRequest(BaseModel):
    """A device posts every attempt that queued while offline in one batch.
    Each item's client_attempt_id is the idempotency key — replaying the
    same batch after a dropped connection must not double-apply it."""

    device_id: str
    attempts: list[AttemptSubmit]


class SyncItemResult(BaseModel):
    client_attempt_id: str
    status: str  # applied | duplicate | failed
    certificate_number: str | None = None
    error: str | None = None


class SyncBatchResult(BaseModel):
    applied: int
    duplicates: int
    failed: int
    results: list[SyncItemResult]
