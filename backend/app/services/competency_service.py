"""
Adaptive competency engine (section 10 of the brief).

Rather than one pass/fail number, every practical action is tagged with a
competency dimension. After each attempt we update a running
(exponential-moving-average) score per dimension, then expose the weakest
one so a caller — the admin dashboard, or eventually the on-device
"next scenario" picker — can target retraining instead of repeating
everything.

This is intentionally a plain function library, not a class: it has no
state of its own, only reads/writes CompetencyScore rows it's handed a
session for.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.assessment import COMPETENCY_DIMENSIONS, Action, CompetencyScore

# Which competency dimension each logged action key contributes to, per
# module. Anything not listed falls back to "procedure_compliance".
ACTION_DIMENSION_MAP: dict[str, dict[str, str]] = {
    "fire": {
        "hazard": "hazard_recognition",
        "ext": "decision_making",
        "route": "evacuation",
        "exit": "evacuation",
        "assembly": "procedure_compliance",
    },
    "gas": {
        "boundary": "hazard_recognition",
        "entry": "decision_making",
        "ppe": "ppe_selection",
        "buddy": "procedure_compliance",
        "emergency": "response_time",
    },
}

_EMA_ALPHA = 0.4  # weight given to the newest sample


def dimension_for_action(module_key: str, action_key: str) -> str:
    return ACTION_DIMENSION_MAP.get(module_key, {}).get(action_key, "procedure_compliance")


def update_competency(
    db: Session, *, worker_id: str, module_id: str, module_key: str, actions: list[Action], time_score: int
) -> None:
    # Aggregate this attempt's actions into a 0-100 score per dimension hit.
    per_dimension: dict[str, list[int]] = {}
    for a in actions:
        dim = dimension_for_action(module_key, a.key)
        # first-try correct = 100, later-try correct = 60, never correct = 0
        pts = 100 if (a.correct and a.tries <= 1) else 60 if a.correct else 0
        per_dimension.setdefault(dim, []).append(pts)
    per_dimension.setdefault("response_time", []).append(time_score * 10)  # /10 -> /100

    for dim, samples in per_dimension.items():
        if dim not in COMPETENCY_DIMENSIONS:
            continue
        observed = round(sum(samples) / len(samples))
        row = (
            db.query(CompetencyScore)
            .filter_by(worker_id=worker_id, module_id=module_id, dimension=dim)
            .first()
        )
        if row is None:
            row = CompetencyScore(worker_id=worker_id, module_id=module_id, dimension=dim, score=observed, sample_count=1)
            db.add(row)
        else:
            row.score = round(row.score * (1 - _EMA_ALPHA) + observed * _EMA_ALPHA)
            row.sample_count += 1


def weakest_dimension(db: Session, *, worker_id: str, module_id: str | None = None) -> tuple[str | None, int | None]:
    q = db.query(CompetencyScore).filter_by(worker_id=worker_id)
    if module_id:
        q = q.filter_by(module_id=module_id)
    rows = q.all()
    if not rows:
        return None, None
    worst = min(rows, key=lambda r: r.score)
    return worst.dimension, worst.score


FOCUS_COPY = {
    "hazard_recognition": "Repeat hazard-identification steps with a harder-to-spot source.",
    "ppe_selection": "Repeat the PPE station with more distractor items.",
    "decision_making": "Repeat the extinguisher/entry decision with a trickier scenario variant.",
    "evacuation": "Repeat the evacuation route scenario — Scenario B (alternate exit blocked).",
    "response_time": "Repeat the emergency-response sequence against the clock.",
    "procedure_compliance": "Repeat the full sequence, emphasising no skipped steps.",
}


def recommend_focus(dimension: str | None) -> str | None:
    if dimension is None:
        return None
    return FOCUS_COPY.get(dimension, "Repeat the scenario.")
