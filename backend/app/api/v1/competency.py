from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.assessment import CompetencyScore
from app.models.training import TrainingModule
from app.models.worker import Worker
from app.schemas.assessment import CompetencyOut, CompetencyReport
from app.services import competency_service

router = APIRouter(prefix="/competency", tags=["competency"])


@router.get("/{worker_code}", response_model=CompetencyReport)
def get_competency(worker_code: str, module_key: str | None = None, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter_by(worker_code=worker_code).first()
    if worker is None:
        raise HTTPException(404, "Worker not found")

    module_id = None
    if module_key:
        module = db.query(TrainingModule).filter_by(key=module_key).first()
        if module is None:
            raise HTTPException(404, f"Unknown module '{module_key}'")
        module_id = module.id

    q = db.query(CompetencyScore).filter_by(worker_id=worker.id)
    if module_id:
        q = q.filter_by(module_id=module_id)
    rows = q.all()

    dimension, _score = competency_service.weakest_dimension(db, worker_id=worker.id, module_id=module_id)
    return CompetencyReport(
        worker_id=worker.id,
        module_id=module_id,
        scores=[CompetencyOut.model_validate(r) for r in rows],
        weakest_dimension=dimension,
        recommended_focus=competency_service.recommend_focus(dimension),
    )
