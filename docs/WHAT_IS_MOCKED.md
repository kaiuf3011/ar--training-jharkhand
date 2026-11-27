# What's real vs. what's mocked/scaffolded

Written to satisfy the brief's own rule (section 26): never let a UI or a
doc imply a capability exists when it doesn't. Read this before demoing or
grading.

| Capability | Status | Where |
|---|---|---|
| Fire & Explosion scenario — full mission logic, scoring, feedback | **Real, playable, tested** | `prototype/ar.js` (`FIRE_M`), exercised via `Agent`-driven browser testing during development |
| Gas & Confined Space scenario | **Real, playable, tested** | `prototype/ar.js` (`GAS_M`) |
| Attempt scoring (30/40/20/10 weighting) | **Real**, computed twice — once client-side for instant feedback, once authoritatively server-side | `prototype/worker.js::scoreAttempt`, `backend/app/services/scoring.py` (unit-tested, `tests/test_scoring.py`) |
| Adaptive competency engine (6 dimensions, weakest-area recommendation) | **Real** | `backend/app/services/competency_service.py` |
| Certificate issuance, expiry, revocation | **Real**, server-authoritative | `backend/app/services/certificate_service.py` |
| QR / certificate verification | **Real** — public endpoint, masked identity, computed (not cached) status | `backend/app/api/v1/verification.py` |
| Offline-first sync, idempotent replay | **Real**, tested including the duplicate-replay case | `backend/app/services/sync_service.py`, `tests/test_vertical_slice.py` |
| Admin compliance dashboard (workers, sites, module pass rates, alerts) | **Real** UI reading real seed/session data in the browser prototype; **real** aggregate queries in the FastAPI `analytics` router — **not yet wired together** (see below) | `prototype/console.js` (`Admin`), `backend/app/api/v1/analytics.py` |
| Hindi text/UI | **Real**, hand-translated | `prototype/core.js` (`I18N.hi`) |
| Santali (Ol Chiki) text/UI | **Draft translation, not reviewed by a native speaker** — flagged as such in-app (Admin → Localization shows the same gap) | `prototype/core.js` (`I18N.sat`), `backend/app/db/seed.py::LOCALIZATION_SEED` |
| AR camera / hazard rendering | **Simulated in the browser** (SVG scenes + drag-to-look) — this is a deliberate, working stand-in for a phone camera feed, not a claim of real AR | `prototype/core.js` (`sceneFire`, `sceneGas`) |
| Native Android/iOS AR app (ARCore/ARKit, real camera passthrough) | **Not built.** Folder structure + a handful of interface/contract C# files only; nothing compiled or run on a device | `unity/README.md` explains exactly what exists and what doesn't |
| LiDAR-enhanced scanning | **Not implemented.** `IRuntimeAdapter.Capabilities.EnvironmentDetail` is the extension point, unpopulated | `unity/Assets/AR/Core/IRuntimeAdapter.cs` |
| Computer vision / object detection | **Not implemented.** `IVisionDetector` interface + `MockVisionDetector`, explicitly labeled | `unity/Assets/Vision/Detection/IVisionDetector.cs` |
| Blender 3D assets | **Not modeled.** Folder structure + export conventions only | `blender/README.md` |
| VR support | **Not implemented, not attempted.** The runtime abstraction (`IRuntimeAdapter`) is written so it *could* be added later without touching scenario/assessment code, per the brief — that is the entire scope of "VR-readiness" in this build | `unity/Assets/AR/Core/IRuntimeAdapter.cs` |
| PostgreSQL in production | **Schema and driver verified** (Alembic migration applies cleanly, `alembic check` reports no drift, `psycopg` engine constructs correctly); **not run end-to-end against a live Postgres server** — no Docker daemon was available in the environment this was built in | `backend/docker-compose.yml`, `backend/README.md` |

## The one thing worth being direct about

**The frontend prototype and the FastAPI backend are not yet wired
together.** Both are real and independently tested — the prototype has its
own realistic in-browser sample data (see `prototype/core.js`), and the
backend has its own tested vertical slice (`backend/tests/`) — but the
browser prototype does not currently call the FastAPI API at runtime.
Connecting them (a `fetch`-based API client in the prototype, replacing the
hard-coded sample data with real calls, falling back to local data when
offline exactly as the offline-first architecture intends) is the natural
next step and was deliberately left for a follow-up pass rather than rushed
into an already-large change, risking the frontend end-to-end testing done
in the previous session.
