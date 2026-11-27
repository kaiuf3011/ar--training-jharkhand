from pydantic import BaseModel, ConfigDict


class SiteCreate(BaseModel):
    name: str
    site_type: str
    district: str


class SiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    site_type: str
    district: str
