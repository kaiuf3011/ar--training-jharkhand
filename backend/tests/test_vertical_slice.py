"""
The full worker -> attempt -> certificate -> QR verify -> offline sync
replay -> admin dashboard path from the brief's "critical vertical slice"
(section 25), run as an actual repeatable test rather than a manual script.
"""
import uuid
from datetime import datetime, timedelta, timezone


def _submit_body(worker_code: str, module_key: str, *, passing: bool, client_attempt_id: str | None = None):
    correct = [0, 1, 2] if module_key == "fire" else [1, 2, 0]
    answers = correct if passing else [x ^ 1 for x in correct]  # deliberately wrong
    actions = [
        {"key": "hazard", "label": "Hazard identification", "tries": 1, "violations": 0, "correct": passing, "reasons": []},
        {"key": "ext", "label": "Extinguisher selection", "tries": 1, "violations": 0, "correct": passing, "reasons": []},
        {"key": "route", "label": "Route selection", "tries": 1, "violations": 0, "correct": passing, "reasons": []},
    ]
    now = datetime.now(timezone.utc)
    return {
        "client_attempt_id": client_attempt_id or str(uuid.uuid4()),
        "worker_id": worker_code,
        "module_key": module_key,
        "quiz_answers": answers,
        "actions": actions,
        "elapsed_seconds": 90,
        "started_at": (now - timedelta(minutes=2)).isoformat(),
        "completed_at": now.isoformat(),
    }


def test_full_vertical_slice(client, seeded):
    worker_code = seeded["worker"].worker_code

    # download offline pack
    r = client.get("/api/v1/training/fire/pack")
    assert r.status_code == 200
    assert len(r.json()["questions"]) == 3

    # submit a passing attempt
    body = _submit_body(worker_code, "fire", passing=True)
    r = client.post("/api/v1/assessments/submit", json=body)
    assert r.status_code == 200, r.text
    attempt = r.json()
    assert attempt["status"] == "passed"
    assert attempt["total_score"] >= 70

    # certificate was issued
    r = client.get(f"/api/v1/assessments/{body['client_attempt_id']}/certificate")
    assert r.status_code == 200
    cert = r.json()
    assert cert["certificate_number"].startswith("JH-FR-")

    # QR verification is public (no auth) and returns masked identity
    r = client.get(f"/verify/{cert['certificate_number']}")
    assert r.status_code == 200
    v = r.json()
    assert v["result"] == "valid"
    assert v["worker_name"] == "Test W."  # first name + last initial only

    # replaying the exact same submission (offline retry) is a no-op
    r = client.post("/api/v1/sync/batch", json={"device_id": "d1", "attempts": [body]})
    assert r.status_code == 200
    sync = r.json()
    assert sync["applied"] == 0 and sync["duplicates"] == 1

    # admin dashboard reflects the result
    login = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "Passw0rd!"})
    auth = {"Authorization": f"Bearer {login.json()['access_token']}"}
    r = client.get("/api/v1/analytics/overview", headers=auth)
    assert r.status_code == 200
    overview = r.json()
    assert overview["workers"] == 1
    assert overview["certified"] == 1
    assert overview["certification_rate"] == 100.0


def test_failed_attempt_issues_no_certificate(client, seeded):
    worker_code = seeded["worker"].worker_code
    body = _submit_body(worker_code, "gas", passing=False)
    r = client.post("/api/v1/assessments/submit", json=body)
    assert r.status_code == 200
    assert r.json()["status"] == "failed"

    r = client.get(f"/api/v1/assessments/{body['client_attempt_id']}/certificate")
    assert r.status_code == 200
    assert r.json() is None


def test_unknown_worker_is_rejected(client, seeded):
    body = _submit_body("JH-NOPE-99999", "fire", passing=True)
    r = client.post("/api/v1/assessments/submit", json=body)
    assert r.status_code == 404


def test_sync_batch_applies_new_and_flags_duplicate_together(client, seeded):
    worker_code = seeded["worker"].worker_code
    fresh = _submit_body(worker_code, "gas", passing=True)
    r = client.post("/api/v1/sync/batch", json={"device_id": "d2", "attempts": [fresh]})
    assert r.status_code == 200
    result = r.json()
    assert result["applied"] == 1 and result["duplicates"] == 0

    replay = client.post("/api/v1/sync/batch", json={"device_id": "d2", "attempts": [fresh]})
    result2 = replay.json()
    assert result2["applied"] == 0 and result2["duplicates"] == 1
