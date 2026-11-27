from pydantic import BaseModel, ConfigDict


class TrainingModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    key: str
    name: str
    status: str
    certificate_prefix: str
    validity_days: int
    pass_mark: int


class ScenarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    module_id: str
    key: str
    title: str
    version: str
    config: dict


class QuestionOut(BaseModel):
    """Correct_index and explanations are included — this endpoint is used
    to download the offline training pack, and scoring happens on-device
    first, then is re-verified server-side on sync (app.services.scoring)."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    module_id: str
    text_en: str
    text_hi: str
    text_sat: str
    options: list
    correct_index: int
    explanation_en: str
    explanation_hi: str
    explanation_sat: str


class TrainingPack(BaseModel):
    """What a device downloads once (over Wi-Fi) and caches for fully
    offline training — the response shape for GET /training/{module}/pack."""
    module: TrainingModuleOut
    scenarios: list[ScenarioOut]
    questions: list[QuestionOut]
