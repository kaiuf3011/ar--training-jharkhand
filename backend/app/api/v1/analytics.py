from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.assessment import Attempt
from app.models.certificate import Certificate
from app.models.progress import TrainingProgress
from app.models.site import Site
from app.models.training import TrainingModule
from app.models.worker import Worker
from app.schemas.analytics import ComplianceAlerts, ModulePassRate, OverviewStats, SitePerformance
from app.services.certificate_service import effective_status
from app.utils.dt import as_aware_utc

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _certified_worker_ids(db: Session) -> set[str]:
    certs = db.query(Certificate).all()
    return {c.worker_id for c in certs if effective_status(c) == "valid"}


@router.get("/overview", response_model=OverviewStats)
def overview(db: Session = Depends(get_db)):
    total_workers = db.query(Worker).count()
    certified_ids = _certified_worker_ids(db)
    in_training_ids = {
        p.worker_id for p in db.query(TrainingProgress).filter_by(status="in_progress").all()
    } - certified_ids
    pending = max(0, total_workers - len(certified_ids) - len(in_training_ids))
    rate = round(len(certified_ids) / total_workers * 100, 1) if total_workers else 0.0
    return OverviewStats(
        workers=total_workers,
        certified=len(certified_ids),
        in_training=len(in_training_ids),
        pending=pending,
        certification_rate=rate,
    )


@router.get("/sites", response_model=list[SitePerformance])
def site_performance(db: Session = Depends(get_db)):
    certified_ids = _certified_worker_ids(db)
    out: list[SitePerformance] = []
    for site in db.query(Site).order_by(Site.name).all():
        workers = db.query(Worker).filter_by(site_id=site.id).all()
        certified = sum(1 for w in workers if w.id in certified_ids)
        rate = round(certified / len(workers) * 100, 1) if workers else 0.0
        out.append(SitePerformance(site_id=site.id, site_name=site.name, workers=len(workers), certified=certified, certification_rate=rate))
    return out


@router.get("/modules", response_model=list[ModulePassRate])
def module_pass_rate(db: Session = Depends(get_db)):
    out: list[ModulePassRate] = []
    for module in db.query(TrainingModule).all():
        attempts = db.query(Attempt).filter_by(module_id=module.id).all()
        passed = sum(1 for a in attempts if a.status == "passed")
        rate = round(passed / len(attempts) * 100, 1) if attempts else 0.0
        out.append(ModulePassRate(module_key=module.key, module_name=module.name, attempts=len(attempts), passed=passed, pass_rate=rate))
    return out


@router.get("/compliance-alerts", response_model=ComplianceAlerts)
def compliance_alerts(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    certs = db.query(Certificate).all()
    expired = sum(1 for c in certs if effective_status(c) == "expired")
    expiring_soon = sum(
        1 for c in certs if effective_status(c) == "valid" and as_aware_utc(c.expires_at) <= now + timedelta(days=30)
    )

    # This build does not model a separate "orientation" module, so
    # "orientation incomplete" is approximated as workers with zero
    # recorded attempts of any kind — a real deployment with an
    # orientation module would filter on that module's progress instead.
    workers_with_attempts = {a.worker_id for a in db.query(Attempt).all()}
    orientation_incomplete = db.query(Worker).count() - len(workers_with_attempts)

    certified_ids = _certified_worker_ids(db)
    failed_worker_ids = {a.worker_id for a in db.query(Attempt).filter_by(status="failed").all()}
    failed_uncertified = len(failed_worker_ids - certified_ids)

    return ComplianceAlerts(
        expired_certificates=expired,
        expiring_within_30_days=expiring_soon,
        orientation_incomplete=max(0, orientation_incomplete),
        failed_assessments=failed_uncertified,
    )
