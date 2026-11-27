"""
The one place an attempt actually gets applied to the database — called
identically whether the device is submitting live (ONLINE) or replaying a
batch that queued while offline (POST /sync/batch). That symmetry is the
point: offline is not a degraded code path, it is the same path with a
delay in front of it.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.assessment import Action, Attempt
from app.models.certificate import Certificate
from app.models.progress import TrainingProgress
from app.models.training import Question, TrainingModule
from app.models.worker import Worker
from app.schemas.assessment import AttemptSubmit
from app.services import certificate_service, competency_service
from app.services.scoring import score_attempt


class AttemptError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


def apply_attempt(db: Session, submission: AttemptSubmit) -> tuple[Attempt, Certificate | None, bool]:
    """Returns (attempt, certificate_or_none, was_duplicate). Idempotent on
    client_attempt_id: replaying the same submission returns the existing
    row instead of creating a second one."""
    existing = db.query(Attempt).filter_by(client_attempt_id=submission.client_attempt_id).first()
    if existing is not None:
        cert = db.query(Certificate).filter_by(attempt_id=existing.id).first()
        return existing, cert, True

    worker = db.query(Worker).filter_by(worker_code=submission.worker_id).first()
    if worker is None:
        raise AttemptError(404, f"Unknown worker_id '{submission.worker_id}' — register the worker before submitting attempts.")

    module = db.query(TrainingModule).filter_by(key=submission.module_key).first()
    if module is None:
        raise AttemptError(404, f"Unknown module_key '{submission.module_key}'.")

    questions = db.query(Question).filter_by(module_id=module.id).order_by(Question.created_at).all()
    correct_indices = [q.correct_index for q in questions]

    result = score_attempt(
        module_key=module.key,
        pass_mark=module.pass_mark,
        quiz_answers=submission.quiz_answers,
        correct_indices=correct_indices,
        actions=submission.actions,
        elapsed_seconds=submission.elapsed_seconds,
    )

    attempt = Attempt(
        client_attempt_id=submission.client_attempt_id,
        worker_id=worker.id,
        module_id=module.id,
        status="passed" if result.passed else "failed",
        knowledge_score=result.knowledge_score,
        ar_score=result.ar_score,
        procedure_score=result.procedure_score,
        time_score=result.time_score,
        total_score=result.total_score,
        elapsed_seconds=submission.elapsed_seconds,
        started_at=submission.started_at,
        completed_at=submission.completed_at,
        synced_from_offline=False,
    )
    db.add(attempt)
    db.flush()

    action_rows = [
        Action(
            attempt_id=attempt.id,
            key=a.key,
            label=a.label,
            tries=a.tries,
            violations=a.violations,
            correct=a.correct,
            reasons=a.reasons,
        )
        for a in submission.actions
    ]
    db.add_all(action_rows)

    competency_service.update_competency(
        db,
        worker_id=worker.id,
        module_id=module.id,
        module_key=module.key,
        actions=action_rows,
        time_score=result.time_score,
    )

    progress = db.query(TrainingProgress).filter_by(worker_id=worker.id, module_id=module.id).first()
    if progress is None:
        # Explicit defaults here, not relied on from the column default:
        # that default only applies at INSERT time, but we read these
        # fields back below before the row is ever flushed.
        progress = TrainingProgress(worker_id=worker.id, module_id=module.id, status="not_started", progress_percent=0, best_score=None)
        db.add(progress)
    if result.passed:
        progress.status = "completed"
        progress.progress_percent = 100
    else:
        progress.status = "in_progress"
        progress.progress_percent = max(progress.progress_percent, 60)
    if progress.best_score is None or result.total_score > progress.best_score:
        progress.best_score = result.total_score

    certificate = None
    if result.passed:
        certificate = certificate_service.issue_certificate(
            db, worker_id=worker.id, module=module, attempt_id=attempt.id, score=result.total_score
        )

    db.commit()
    db.refresh(attempt)
    return attempt, certificate, False
