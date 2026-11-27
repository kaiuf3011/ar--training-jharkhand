from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.training import Question, Scenario, TrainingModule
from app.schemas.training import TrainingModuleOut, TrainingPack

router = APIRouter(prefix="/training", tags=["training"])


@router.get("/modules", response_model=list[TrainingModuleOut])
def list_modules(db: Session = Depends(get_db)):
    return db.query(TrainingModule).order_by(TrainingModule.certificate_prefix).all()


@router.get("/{module_key}/pack", response_model=TrainingPack)
def download_pack(module_key: str, db: Session = Depends(get_db)):
    """What the device downloads once (over Wi-Fi, per the offline-first
    requirement) and caches locally: the module record, every scenario
    definition, and the full question bank with answers — scoring happens
    on-device first and is re-verified on sync, so the device needs the
    answer key locally to do that."""
    module = db.query(TrainingModule).filter_by(key=module_key).first()
    if module is None:
        raise HTTPException(404, f"Unknown module '{module_key}'")
    scenarios = db.query(Scenario).filter_by(module_id=module.id).all()
    questions = db.query(Question).filter_by(module_id=module.id).all()
    return TrainingPack(module=module, scenarios=scenarios, questions=questions)
