from app.schemas.assessment import ActionIn
from app.services.scoring import score_attempt


def _actions(n_correct_first_try: int, n_correct_retry: int = 0, n_wrong: int = 0, violations: int = 0) -> list[ActionIn]:
    out = []
    for i in range(n_correct_first_try):
        out.append(ActionIn(key=f"a{i}", label="x", tries=1, correct=True, violations=0))
    for i in range(n_correct_retry):
        out.append(ActionIn(key=f"b{i}", label="x", tries=2, correct=True, violations=0))
    for i in range(n_wrong):
        out.append(ActionIn(key=f"c{i}", label="x", tries=1, correct=False, violations=1 if i == 0 else 0))
    if violations:
        out[0].violations = violations
    return out


def test_perfect_attempt_scores_100():
    r = score_attempt(
        module_key="fire", pass_mark=70,
        quiz_answers=[0, 1, 2], correct_indices=[0, 1, 2],
        actions=_actions(5), elapsed_seconds=100,
    )
    assert r.knowledge_score == 30
    assert r.ar_score == 40
    assert r.procedure_score == 20
    assert r.time_score == 10
    assert r.total_score == 100
    assert r.passed


def test_wrong_answers_and_violations_reduce_score_and_fail():
    r = score_attempt(
        module_key="fire", pass_mark=70,
        quiz_answers=[1, 1, 1], correct_indices=[0, 1, 2],  # 1/3 correct
        actions=_actions(0, n_wrong=5, violations=2), elapsed_seconds=100,
    )
    assert r.knowledge_score == 10
    assert r.ar_score == 0
    assert r.procedure_score == 20 - 2 * 6  # = 8
    assert not r.passed
    assert len(r.mistakes) > 0


def test_slow_response_time_caps_time_score():
    fast = score_attempt(module_key="fire", pass_mark=70, quiz_answers=[0, 1, 2], correct_indices=[0, 1, 2], actions=_actions(5), elapsed_seconds=140)
    slow = score_attempt(module_key="fire", pass_mark=70, quiz_answers=[0, 1, 2], correct_indices=[0, 1, 2], actions=_actions(5), elapsed_seconds=400)
    assert fast.time_score == 10
    assert slow.time_score == 4
    assert slow.total_score < fast.total_score


def test_retry_correct_actions_score_half():
    r = score_attempt(
        module_key="gas", pass_mark=70,
        quiz_answers=[1, 2, 0], correct_indices=[1, 2, 0],
        actions=_actions(0, n_correct_retry=5), elapsed_seconds=100,
    )
    assert r.ar_score == 4 * 5  # each retry-correct action worth 4, not 8
