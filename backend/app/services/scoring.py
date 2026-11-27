"""
Attempt scoring — mirrors the client-side scorer in prototype/worker.js
(scoreAttempt) so a result computed offline on-device and one recomputed
here from the same raw actions agree. Recomputing server-side (rather than
trusting the client's own total) is deliberate: a client can lie about its
score, it cannot lie about which raw actions it logged without the
recomputed total changing too.

Weights: Knowledge 30 · AR practical actions 40 · Procedure 20 · Time 10.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.schemas.assessment import ActionIn

# Same response-time targets used client-side (seconds) per module.
TIME_TARGET_SECONDS = {"fire": 150, "gas": 210}


@dataclass
class ScoreResult:
    knowledge_score: int
    ar_score: int
    procedure_score: int
    time_score: int
    total_score: int
    passed: bool
    mistakes: list[dict] = field(default_factory=list)


def score_attempt(
    *,
    module_key: str,
    pass_mark: int,
    quiz_answers: list[int],
    correct_indices: list[int],
    actions: list[ActionIn],
    elapsed_seconds: int,
) -> ScoreResult:
    mistakes: list[dict] = []

    # Knowledge — 10 points per question, up to 30 (first 3 questions count,
    # matching the fixed 3-question bank per module in this build).
    knowledge = 0
    for i, correct in enumerate(correct_indices):
        picked = quiz_answers[i] if i < len(quiz_answers) else None
        if picked == correct:
            knowledge += 10
        else:
            mistakes.append({"kind": "knowledge", "question_index": i})
    knowledge = min(30, knowledge)

    # AR practical actions — first-try correct actions score 8, correct on
    # a later try score 4, never-correct actions score 0. Cap at 40.
    ar_score = 0
    violations = 0
    for a in actions:
        if a.correct:
            ar_score += 8 if a.tries <= 1 else 4
        else:
            mistakes.append({"kind": "action", "key": a.key, "label": a.label})
        violations += a.violations
    ar_score = min(40, ar_score)

    # Procedure — starts at 20, -6 per safety violation, floor 0.
    procedure = max(0, 20 - violations * 6)

    # Response time — full 10 within target, 7 within 1.5x, else 4.
    target = TIME_TARGET_SECONDS.get(module_key, 180)
    if elapsed_seconds <= target:
        time_score = 10
    elif elapsed_seconds <= target * 1.5:
        time_score = 7
    else:
        time_score = 4
    if time_score < 10:
        mistakes.append({"kind": "time", "elapsed_seconds": elapsed_seconds, "target_seconds": target})

    total = knowledge + ar_score + procedure + time_score
    return ScoreResult(
        knowledge_score=knowledge,
        ar_score=ar_score,
        procedure_score=procedure,
        time_score=time_score,
        total_score=total,
        passed=total >= pass_mark,
        mistakes=mistakes,
    )
