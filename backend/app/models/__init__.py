"""
Import every model module here so Base.metadata is fully populated for
`Base.metadata.create_all()` (used by tests and first-run dev) and for
Alembic's autogenerate to see the whole schema.
"""
from app.models.audit import AuditLog  # noqa: F401
from app.models.assessment import Action, Attempt, CompetencyScore  # noqa: F401
from app.models.certificate import Certificate, CertificateVerification  # noqa: F401
from app.models.localization import Localization  # noqa: F401
from app.models.progress import TrainingProgress  # noqa: F401
from app.models.site import Site  # noqa: F401
from app.models.sync import SyncRecord  # noqa: F401
from app.models.training import Question, Scenario, TrainingModule  # noqa: F401
from app.models.user import User, UserRole  # noqa: F401
from app.models.worker import Worker  # noqa: F401
