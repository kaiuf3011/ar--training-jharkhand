# Jharkhand Safety AR

Offline-first AR vocational safety training, competency assessment, and
digital certification platform for industrial workers — built for Smart
India Hackathon Problem Statement 26041.

Two things exist in this repo, both real and independently tested; how
they fit together (and what's still scaffolding) is laid out in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/WHAT_IS_MOCKED.md`](docs/WHAT_IS_MOCKED.md) — **read the second one
before demoing or grading this.**

## 1. The product — a clickable prototype ([`prototype/`](prototype/))

A worker Android AR app (simulated in-browser), a supervisor QR-verification
app, and a web admin compliance console, all sharing one connected state.
Two full AR training scenarios are playable end to end: **Fire & Explosion
Response** and **Gas Leak & Confined Space**.

```bash
npm run preview   # builds and serves prototype/ at http://localhost:8080
```

Deep links: `/#worker`, `/#supervisor`, `/#admin`, `/#system` (design
system). Deployable to Vercel as-is — see `vercel.json` / `build.mjs`.

## 2. The backend — FastAPI + PostgreSQL ([`backend/`](backend/))

A real, tested compliance API: worker records, data-driven scenarios,
server-authoritative scoring, an adaptive per-dimension competency engine,
certificate issuance with public QR verification, and idempotent
offline-sync replay.

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload   # http://localhost:8000/docs
```

```bash
pytest -q   # 17 tests, isolated per-test SQLite DB
```

Postgres via Docker: `cd backend && docker compose up --build`. Full
details, schema, and the security notes worth reading before any real
deployment: [`backend/README.md`](backend/README.md).

## What's not built yet, honestly

- The browser prototype and the FastAPI backend are **not yet wired
  together** — each is real and tested on its own.
- No native Android/iOS AR app exists. [`unity/`](unity/) is a folder
  structure plus a handful of interface contracts (vision detector, AR/VR
  runtime abstraction, API client, offline sync queue) — nothing compiled,
  nothing run on a device. See [`unity/README.md`](unity/README.md).
- No computer-vision model exists — one interface, one explicitly-labeled
  mock implementation.
- No 3D assets exist. [`blender/`](blender/) is folder structure and
  export conventions only.
- The Postgres path is schema/driver-verified but was not run end-to-end
  (no Docker daemon in the environment this was built in).

Full breakdown, capability by capability: [`docs/WHAT_IS_MOCKED.md`](docs/WHAT_IS_MOCKED.md).

## Repo layout

```
prototype/   the clickable product — worker/supervisor/admin, real & tested
backend/     FastAPI + PostgreSQL compliance API — real & tested
unity/       native AR client — folder structure + contracts, NOT built
blender/     3D asset pipeline — folder structure only, NOT modeled
docs/        architecture + honest capability status
build.mjs    builds prototype/ into dist/ for static hosting (Vercel etc.)
```
