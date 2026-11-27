# Architecture

## System overview

```
                    WORKER
                       │
         ┌─────────────┴──────────────┐
         │   TODAY: browser prototype  │   FUTURE: native Unity AR app
         │   (prototype/) — real,      │   (unity/) — scaffold only,
         │   playable, tested          │   see unity/README.md
         └─────────────┬──────────────┘
                        │
              SCENARIO ENGINE (data-driven: prototype/ar.js
              state machines today; backend Scenario.config
              JSON is the same contract for a native client)
                        │
              INTERACTION ENGINE (drag/tap today;
              raycast/gesture behind IRuntimeAdapter later)
                        │
              ASSESSMENT ENGINE (client scores for instant
              feedback; backend/app/services/scoring.py
              re-scores authoritatively)
                        │
              OFFLINE QUEUE ──── ONLINE ────► FASTAPI (backend/)
              (localStorage today;                  │
               SQLite via                      POSTGRESQL
               IOfflineSyncQueue                     │
               contract, native)          ┌──────────┼──────────┐
                                           ▼          ▼          ▼
                                      CERTIFICATES ANALYTICS   SYNC
                                           │
                                           ▼
                                  QR VERIFICATION (public)
                                           │
                                           ▼
                                  ADMIN DASHBOARD
```

`BLENDER → 3D ASSETS → UNITY → AR (VR later, same scenario/assessment code)`
is the asset pipeline — see `blender/README.md` and `unity/README.md` for
what actually exists there today (folder structure + contracts, not
assets or a compiled app).

## Why AR-first, VR-abstracted-but-not-built

The problem statement requires phone-camera AR on mid-range Android —
that's the only runtime this build targets. The one piece of forward
architecture taken is `unity/Assets/AR/Core/IRuntimeAdapter.cs`: scenario
and assessment logic would depend on that interface, not on
`ARSession`/`ARPlaneManager` directly, so a VR runtime could implement the
same interface later without scenario code changing. No VR runtime exists;
this is the extension point, not the feature.

## Why the backend is Python/FastAPI, not Node

The original prototype (previous session) was entirely static
HTML/CSS/JS with **no backend at all** — there was nothing to migrate away
from. `backend/` is new, built directly to the brief's spec: FastAPI +
SQLAlchemy + Alembic + PostgreSQL (SQLite for zero-setup local dev/tests),
JWT auth, and the exact API surface the brief lists (auth, workers, sites,
training, scenarios, assessments, competency, certificates, verification,
localization, analytics, sync), each in its own `api/v1/*.py` router with
business logic kept in `services/`, not in route handlers.

## Why offline-first is a symmetry, not a special case

`POST /assessments/submit` (online) and `POST /sync/batch` (offline
replay) both call the exact same `sync_service.apply_attempt()`. The
idempotency key (`client_attempt_id`) is minted on-device when an attempt
*starts*, not when it's synced — so a device can queue an attempt, go
offline for a week, retry a dropped sync three times, and the backend
still applies it exactly once. This is tested, not asserted:
`backend/tests/test_vertical_slice.py::test_sync_batch_applies_new_and_flags_duplicate_together`.

## Why scenarios are data, not per-module Unity scripts

`Scenario.config` (backend) is a JSON document — objectives, hazards,
interactables, branching, scoring weights — not hard-coded per module.
`unity/Assets/Scenarios/Core/ScenarioDefinition.cs` mirrors that exact
shape so a native client reads the same contract. The browser prototype
predates this and encodes the same content as JS state machines
(`FIRE_M`/`GAS_M` in `prototype/ar.js`) rather than consuming the JSON —
porting the prototype's logic to read `Scenario.config` at runtime (browser
or native) is the natural next unification, not yet done.

## Certificate trust model

- Public identifier: `certificate_number` (`JH-{PREFIX}-{YEAR}-{seq}`).
  Never the internal UUID.
- Status (`valid`/`expired`/`revoked`) is computed at read time from
  `expires_at`/`status`, never a cached flag that can go stale.
- Verification (`GET /verify/{certificate_number}`) is public and
  unauthenticated by design (a certificate must be checkable without a
  login) but returns a masked name only, and every scan is logged to
  `certificate_verifications` for audit.
- Revocation requires an admin JWT and a reason, and is itself audited.

## Adaptive competency, concretely

Every logged practical action carries a `key` (e.g. `"route"`,
`"ppe"`, `"buddy"`) that `competency_service.ACTION_DIMENSION_MAP` maps to
one of six dimensions. After each attempt, an exponential moving average
per worker/module/dimension is updated, and
`GET /competency/{worker_code}` surfaces the weakest one with a
plain-language next step — the actual mechanism section 10 of the brief
asks for, not a single pass/fail number.

## Known gaps (see also docs/WHAT_IS_MOCKED.md)

1. The browser prototype and the FastAPI backend are not yet wired
   together at runtime (both are independently real and tested).
2. No native mobile client exists — the Unity folder is scaffolding.
3. No computer-vision model exists — `IVisionDetector` has one
   explicitly-labeled mock implementation.
4. No 3D assets exist — the Blender pipeline is folder structure and
   export conventions only.
5. The Postgres path (`docker-compose.yml`) was not run end-to-end (no
   Docker daemon in the build environment) — schema/driver were verified
   by other means; see `backend/README.md`.
