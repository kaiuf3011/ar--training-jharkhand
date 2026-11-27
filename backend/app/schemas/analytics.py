from pydantic import BaseModel


class OverviewStats(BaseModel):
    workers: int
    certified: int
    in_training: int
    pending: int
    certification_rate: float


class SitePerformance(BaseModel):
    site_id: str
    site_name: str
    workers: int
    certified: int
    certification_rate: float


class ModulePassRate(BaseModel):
    module_key: str
    module_name: str
    attempts: int
    passed: int
    pass_rate: float


class ComplianceAlerts(BaseModel):
    expired_certificates: int
    expiring_within_30_days: int
    orientation_incomplete: int
    failed_assessments: int
