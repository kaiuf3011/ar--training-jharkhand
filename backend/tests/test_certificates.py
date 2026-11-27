from datetime import datetime, timedelta, timezone

from app.models.certificate import Certificate
from tests.test_vertical_slice import _submit_body


def _issue_certificate(client, db_session, worker_code: str, module_key: str = "fire"):
    body = _submit_body(worker_code, module_key, passing=True)
    r = client.post("/api/v1/assessments/submit", json=body)
    assert r.status_code == 200
    r = client.get(f"/api/v1/assessments/{body['client_attempt_id']}/certificate")
    return r.json()


def test_verify_not_found(client, seeded):
    r = client.get("/verify/JH-XX-2026-99999")
    assert r.status_code == 200
    body = r.json()
    assert body["found"] is False
    assert body["result"] == "not_found"


def test_verify_expired_certificate(client, seeded, db_session):
    cert_out = _issue_certificate(client, db_session, seeded["worker"].worker_code)
    row = db_session.query(Certificate).filter_by(certificate_number=cert_out["certificate_number"]).first()
    row.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
    db_session.commit()

    r = client.get(f"/verify/{cert_out['certificate_number']}")
    assert r.json()["result"] == "expired"


def test_admin_can_revoke_certificate(client, seeded, db_session):
    cert_out = _issue_certificate(client, db_session, seeded["worker"].worker_code)
    login = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "Passw0rd!"})
    auth = {"Authorization": f"Bearer {login.json()['access_token']}"}

    r = client.post(
        f"/api/v1/certificates/{cert_out['certificate_number']}/revoke",
        json={"reason": "Confined-space entry without permit"},
        headers=auth,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "revoked"

    v = client.get(f"/verify/{cert_out['certificate_number']}")
    body = v.json()
    assert body["result"] == "revoked"
    assert "permit" in body["revoked_reason"]


def test_revoke_requires_admin(client, seeded, db_session):
    cert_out = _issue_certificate(client, db_session, seeded["worker"].worker_code)
    r = client.post(f"/api/v1/certificates/{cert_out['certificate_number']}/revoke", json={"reason": "x"})
    assert r.status_code == 401
