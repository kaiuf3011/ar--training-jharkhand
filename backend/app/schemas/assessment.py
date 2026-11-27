from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ActionIn(BaseModel):
    key: str
    label: str
    tries: int = 1
    violations: int = 0
    correct: bool = False
    reasons: list[dict] = Field(default_factory=list)


class AttemptSubmit(BaseModel):
    """What the AR runtime posts when an attempt finishes — either live
    (ONLINE) or replayed later from the offline sync queue
    (POST /sync/batch), so this shape is shared by both entry points."""

    client_attempt_id: str
    worker_id: str
    module_key: str
    scenario_key: str | None = None
    quiz_answers: list[int] = Field(default_factory=list)  # index picked per question, in module order
    actions: list[ActionIn] = Field(default_factory=list)
    elapsed_seconds: int
    started_at: datetime
    completed_at: datetime


class AttemptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    client_attempt_id: str
    worker_id: str
    module_id: str
    status: str
    knowledge_score: int
    ar_score: int
    procedure_score: int
    time_score: int
    total_score: int
    elapsed_seconds: int
    started_at: datetime
    completed_at: datetime | None
    synced_from_offline: bool


class CompetencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    dimension: str
    score: int
    sample_count: int


class CompetencyReport(BaseModel):
    worker_id: str
    module_id: str | None
    scores: list[CompetencyOut]
    weakest_dimension: str | None
    recommended_focus: str | None
