from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    assessments,
    auth,
    certificates,
    competency,
    localization,
    scenarios,
    sites,
    sync,
    training,
    verification,
    workers,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(workers.router)
api_router.include_router(sites.router)
api_router.include_router(training.router)
api_router.include_router(scenarios.router)
api_router.include_router(assessments.router)
api_router.include_router(competency.router)
api_router.include_router(certificates.router)
api_router.include_router(localization.router)
api_router.include_router(analytics.router)
api_router.include_router(sync.router)

# Public, unversioned verification route: a printed/QR certificate must
# keep resolving at the same /verify/{id} URL even if the rest of the API
# moves to /api/v2 someday — mounted separately in app.main, not under
# api_router's /api/v1 prefix.
public_router = APIRouter()
public_router.include_router(verification.router)
