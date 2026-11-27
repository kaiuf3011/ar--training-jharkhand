from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkerCreate(BaseModel):
    worker_code: str
    full_name: str
    role_title: str
    experience_band: str = ""
    language: str = "en"
    site_id: str


class WorkerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    worker_code: str
    full_name: str
    role_title: str
    experience_band: str
    language: str
    site_id: str
    created_at: datetime


class WorkerListItem(WorkerOut):
    site_name: str = ""
    best_score: int | None = None
    certification_status: str = "pending"
    last_activity: datetime | None = None
