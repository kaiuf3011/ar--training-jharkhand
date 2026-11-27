from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_admin_or_supervisor
from app.db.session import get_db
from app.models.assessment import Attempt
from app.models.certificate import Certificate
from app.models.site import Site
from app.models.worker import Worker
from app.schemas.worker import WorkerCreate, WorkerListItem, WorkerOut

router = APIRouter(prefix="/workers", tags=["workers"])


@router.post("", response_model=WorkerOut, status_code=201)
def upsert_worker(body: WorkerCreate, db: Session = Depends(get_db)):
    """Create-or-update by worker_code. No auth required: this is the same
    call an unregistered device makes on first launch, potentially offline
    and replayed later via the sync queue — it must be safe to call twice."""
    if db.query(Site).filter_by(id=body.site_id).first() is None:
        raise HTTPException(404, f"Unknown site_id '{body.site_id}'")

    worker = db.query(Worker).filter_by(worker_code=body.worker_code).first()
    if worker is None:
        worker = Worker(**body.model_dump())
        db.add(worker)
    else:
        for k, v in body.model_dump().items():
            setattr(worker, k, v)
    db.commit()
    db.refresh(worker)
    return worker


@router.get("", response_model=list[WorkerListItem])
def list_workers(
    db: Session = Depends(get_db),
    site_id: str | None = None,
    _user=Depends(require_admin_or_supervisor),
):
    q = db.query(Worker)
    if site_id:
        q = q.filter_by(site_id=site_id)
    workers = q.order_by(Worker.full_name).all()

    out: list[WorkerListItem] = []
    for w in workers:
        best = db.query(Attempt).filter_by(worker_id=w.id).order_by(Attempt.total_score.desc()).first()
        cert = db.query(Certificate).filter_by(worker_id=w.id).order_by(Certificate.issued_at.desc()).first()
        last = db.query(Attempt).filter_by(worker_id=w.id).order_by(Attempt.created_at.desc()).first()
        out.append(
            WorkerListItem(
                **WorkerOut.model_validate(w).model_dump(),
                site_name=w.site.name if w.site else "",
                best_score=best.total_score if best else None,
                certification_status=(cert.status if cert else "pending"),
                last_activity=last.created_at if last else None,
            )
        )
    return out


@router.get("/{worker_code}", response_model=WorkerOut)
def get_worker(worker_code: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter_by(worker_code=worker_code).first()
    if worker is None:
        raise HTTPException(404, "Worker not found")
    return worker
