from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.training import Scenario
from app.schemas.training import ScenarioOut

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/{scenario_id}", response_model=ScenarioOut)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter_by(id=scenario_id).first()
    if scenario is None:
        raise HTTPException(404, "Scenario not found")
    return scenario
