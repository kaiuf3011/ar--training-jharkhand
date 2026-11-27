# Backend — FastAPI + PostgreSQL

Real, working, tested compliance backend for Jharkhand Safety AR: worker
records, data-driven scenarios, attempt scoring, an adaptive competency
engine, certificate issuance, public QR verification, and idempotent
offline sync. Not a mock — every endpoint below is backed by the tests in
`tests/`.

## Quickstart (SQLite, zero setup)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed        # 6 sites, 5 modules, 2 live question banks,
                              # 1 demo admin, 1 demo worker
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for interactive OpenAPI docs, or
http://localhost:8000/health to confirm it's up. The seed script prints the
demo admin's email/password — **change that password before anything but
local dev.**

## Quickstart (Postgres, via Docker)

```bash
cd backend
docker compose up --build
```

This starts Postgres 16, waits for it to be healthy, then runs
`alembic upgrade head`, seeds, and boots uvicorn on `:8000` — same API,
real Postgres instead of SQLite. (Not run end-to-end in the environment
this was built in — no Docker daemon was available there — but the schema,
driver, and every query are dialect-agnostic SQLAlchemy already exercised
against SQLite by the test suite; `docker compose up` is the way to
confirm it against real Postgres.)

## Running tests

```bash
pytest -q
```

17 tests, each against its own throwaway SQLite file (never your dev.db):
scoring math, auth/RBAC, the full vertical slice (register → train →
assess → certify → verify → offline-sync-replay → admin dashboard),
certificate expiry/revocation, and offline-sync idempotency.

## Architecture

```
app/
├── main.py              FastAPI app, CORS, rate limiting, startup
├── api/v1/               one router per resource — auth, workers, sites,
│                         training, scenarios, assessments, competency,
│                         certificates, verification (public), localization,
│                         analytics, sync
├── api/deps.py           JWT auth + role-based access dependencies
├── core/                 settings, password hashing, JWT, rate limiter
├── db/                   SQLAlchemy session/engine, seed script
├── models/                15 SQLAlchemy tables — see below
├── schemas/               Pydantic request/response shapes
└── services/              business logic — routes stay thin:
    ├── scoring.py          the 30/40/20/10 weighted scorer
    ├── competency_service.py   adaptive per-dimension competency + weakest-area recommendation
    ├── certificate_service.py  certificate numbering, expiry, revocation
    ├── sync_service.py         the one function that actually applies an attempt —
    │                           called identically for live submit and offline replay
    └── auth_service.py         login / user creation
```

### Database (15 tables)

`users` (auth) · `workers` · `sites` · `training_modules` · `scenarios`
(data-driven config, JSON) · `questions` · `attempts` · `actions` ·
`competency_scores` · `certificates` · `certificate_verifications` (audit
trail of every QR scan) · `sync_records` · `localizations` ·
`training_progress` · `audit_logs`.

Managed by Alembic (`migrations/`) — `alembic revision --autogenerate -m
"..."` after any model change, `alembic upgrade head` to apply. The
committed initial migration (`migrations/versions/*_initial_schema.py`)
was verified to apply cleanly to a fresh SQLite DB and to produce a schema
Alembic's own `alembic check` reports as fully in sync with the models.

### Offline-first sync

`POST /api/v1/assessments/submit` (live) and `POST /api/v1/sync/batch`
(offline replay) both call `sync_service.apply_attempt()` — the exact same
function. Idempotency is on `client_attempt_id`, a UUID minted **on the
device** when the attempt starts, not when it's synced. Replaying an
already-applied batch (e.g. after a dropped connection mid-sync) returns
the existing attempt/certificate instead of creating a duplicate — see
`tests/test_vertical_slice.py::test_sync_batch_applies_new_and_flags_duplicate_together`.

### Certificates & verification

`certificate_number` (e.g. `JH-FR-2026-00421`) is what's public — the QR
code, the `/verify/{certificate_number}` response, everything. The
internal UUID `id` never leaves the server. Verification is intentionally
unauthenticated (a certificate must be checkable without a login) and
returns only a masked name ("Rahul K.") — never the full worker record.
Status is computed at read time (`valid` / `expired` / `revoked`), not a
cron-updated flag, so it's never stale.

### Competency engine

Every logged practical action is tagged with one of six dimensions
(`hazard_recognition`, `ppe_selection`, `decision_making`, `evacuation`,
`response_time`, `procedure_compliance`) via a per-module mapping in
`competency_service.ACTION_DIMENSION_MAP`, then folded into a running
exponential-moving-average score per worker/module/dimension.
`GET /api/v1/competency/{worker_code}` returns the weakest dimension and a
plain-language recommendation — the hook a future "next scenario" picker
(on-device or server-side) would read from, rather than repeating the
whole module on any failure.

## Security notes (what's real, what to change before production)

- Password hashing is PBKDF2-HMAC-SHA256 (stdlib `hashlib`), not
  bcrypt/argon2 — a deliberate choice to avoid a compiled dependency that
  may not ship wheels for very new Python versions yet. Fine for a
  hackathon deployment; move to argon2id before anything real.
- JWT (`PyJWT`, HS256). `JWT_SECRET` has an insecure default that only
  works when `ENV=development` — the app refuses to start with the
  default secret in any other `ENV`.
- Rate limiting is in-process (a dict + sliding window), correct for one
  process, not for multiple uvicorn workers/replicas — see the comment in
  `app/core/rate_limit.py`.
- CORS defaults to `*` — tighten `CORS_ORIGINS` in `.env` before deploying
  the admin console anywhere public.
- Nothing sensitive is embedded in a certificate's QR payload — just the
  certificate number.

## What's NOT here

This backend is real and tested. What it does **not** do is render AR,
run computer vision, or talk to a mobile device at all yet — see
`../unity/README.md` and `../docs/WHAT_IS_MOCKED.md` for exactly what
still needs building and what's honestly scaffolded versus implemented.
