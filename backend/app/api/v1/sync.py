from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import sync_service
from app.schemas.sync import SyncBatchRequest, SyncBatchResult, SyncItemResult

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/batch", response_model=SyncBatchResult)
def sync_batch(body: SyncBatchRequest, db: Session = Depends(get_db)):
    """Replay every attempt a device queued while offline. Each item is
    applied through the exact same apply_attempt() the live /assessments/submit
    route uses, keyed on client_attempt_id — so re-POSTing an already-applied
    batch (e.g. after a dropped connection mid-sync) is always safe."""
    results: list[SyncItemResult] = []
    applied = duplicates = failed = 0

    for submission in body.attempts:
        try:
            attempt, cert, was_duplicate = sync_service.apply_attempt(db, submission)
        except sync_service.AttemptError as e:
            failed += 1
            results.append(SyncItemResult(client_attempt_id=submission.client_attempt_id, status="failed", error=e.detail))
            continue

        if was_duplicate:
            duplicates += 1
            status_str = "duplicate"
        else:
            applied += 1
            status_str = "applied"
        results.append(
            SyncItemResult(
                client_attempt_id=attempt.client_attempt_id,
                status=status_str,
                certificate_number=cert.certificate_number if cert else None,
            )
        )

    return SyncBatchResult(applied=applied, duplicates=duplicates, failed=failed, results=results)
