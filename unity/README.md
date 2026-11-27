# Unity AR client — status: SCAFFOLD ONLY, NOT A BUILDABLE PROJECT

**Read this before assuming anything here runs.** There is no Unity Editor,
Android SDK, or Xcode toolchain available in the environment this was
written in, so nothing under `Assets/` has been opened in Unity, compiled,
or run on a device. What exists is:

- the folder structure from the architecture brief, so a Unity project
  dropped in here lands in the right layout from day one;
- a handful of interface/contract C# files (listed below) that define how
  the pieces are meant to talk to each other and to the real backend —
  written to compile against Unity/C# conventions, but **unverified**,
  since nothing here compiles them;
- everywhere else, an empty folder with `.gitkeep` — a placeholder, not an
  implementation.

The actual AR experience today (hazard identification, extinguisher
selection, evacuation routing, PPE station, buddy positioning, assessment,
certification, QR verification) is fully built and playable in the browser
— see [`../prototype/`](../prototype/) and [`../prototype/ar.js`](../prototype/ar.js).
That is the real, working reference implementation of every scenario's
logic and scoring. Porting it to Unity means re-implementing the same
state machines (`FIRE_M`/`GAS_M` in `ar.js`) against AR Foundation instead
of CSS transforms — the scenario *logic* doesn't change, only what renders
it.

## What's actually here

| File | What it is |
|---|---|
| `Assets/Vision/Detection/IVisionDetector.cs` | The pluggable CV interface from section 7 of the brief, plus `MockVisionDetector` — explicitly named and commented as a mock, never claiming real detection. |
| `Assets/AR/Core/IRuntimeAdapter.cs` | The AR/VR abstraction boundary (section 2) — scenario/interaction/assessment logic depends on this interface, never on `ARSession`/`XRSession` directly, so an AR build and a future VR build share everything above this line. |
| `Assets/Scenarios/Core/ScenarioDefinition.cs` | C# data classes mirroring the exact JSON shape the backend's `Scenario.config` column stores (see `backend/app/db/seed.py`'s `FIRE_SCENARIO_CONFIG`) — the data-driven scenario contract from section 12. |
| `Assets/Networking/API/ApiClient.cs` | A `UnityWebRequest`-based client for the real FastAPI routes (`/training/{module}/pack`, `/assessments/submit`, `/sync/batch`, `/verify/{id}`) — the request/response shapes match `backend/app/schemas/*.py` exactly, so a device can talk to the real backend once this compiles inside an actual Unity project. |
| `Assets/Offline/SyncQueue/OfflineSyncQueue.cs` | The offline-first queue contract — local persistence interface + the idempotency key pattern (`client_attempt_id`) the backend already implements and tests (`backend/tests/test_vertical_slice.py::test_sync_batch_applies_new_and_flags_duplicate_together`). |

## To turn this into a real project

1. Create a new Unity 2022 LTS (or newer) 3D project, or open one in this
   directory if you initialize it here.
2. Install via Package Manager: **AR Foundation**, **ARCore XR Plugin**
   (Android), **ARKit XR Plugin** (iOS), and enable them per-platform in
   Project Settings → XR Plug-in Management.
3. Copy/merge this `Assets/` tree into the new project — the folders are
   already named to match.
4. Build the AR calibration flow (plane detection → anchor placement)
   against `ARPlaneManager`/`ARAnchorManager`, implementing
   `IRuntimeAdapter` for AR Foundation.
5. Port `ar.js`'s `FIRE_M`/`GAS_M` mission state machines into C#
   `MonoBehaviour`s driven by the same `ScenarioDefinition` data, rendering
   3D assets (see `../blender/README.md`) instead of the SVG scenes.
6. Wire `ApiClient` to the real backend (`../backend/README.md`) and
   `OfflineSyncQueue` to a local SQLite file via a plugin such as
   `SQLite4Unity3d`.
7. Replace `MockVisionDetector` with a real on-device model (ONNX Runtime
   or LiteRT/TFLite) only once one is actually trained and evaluated —
   until then, leave the mock in place and labeled as a mock.

## LiDAR / depth

`IRuntimeAdapter` exposes an `EnvironmentDetail` capability enum
(`PlaneOnly` / `DepthAssisted` / `LiDARScene`) that a concrete AR
Foundation implementation would populate from
`AROcclusionManager.environmentDepthTemperatureMode` /
`XRSessionSubsystem` capability checks at runtime, falling back
automatically per section 3 of the brief. No LiDAR-specific code exists
yet — this is the extension point for it, not an implementation of it.
