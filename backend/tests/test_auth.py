def test_login_success(client, seeded):
    r = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "Passw0rd!"})
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "admin"
    assert body["access_token"]


def test_login_wrong_password(client, seeded):
    r = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_admin_only_route_rejects_missing_token(client, seeded):
    r = client.get("/api/v1/workers")
    assert r.status_code == 401


def test_admin_only_route_rejects_worker_token(client, seeded):
    from app.core.security import create_access_token

    token = create_access_token(subject="someone", role="worker")
    r = client.get("/api/v1/workers", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_register_admin_blocked_after_first_admin_exists(client, seeded):
    r = client.post("/api/v1/auth/register-admin", json={"email": "second@example.com", "password": "x", "display_name": "X"})
    assert r.status_code == 403
