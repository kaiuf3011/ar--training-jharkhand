using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace JharkhandSafetyAR.Networking
{
    /// <summary>
    /// Thin client for the real FastAPI backend (../../backend). Request
    /// and response shapes here are written to match
    /// backend/app/schemas/*.py exactly — this file has not been compiled
    /// (no Unity in this environment), but the contract is not invented:
    /// it's the same backend already covered by
    /// backend/tests/test_vertical_slice.py.
    ///
    /// Base URL is not hard-coded — inject it from a build-time config
    /// asset so a device can point at a local dev backend, a staging
    /// server, or production without a rebuild.
    /// </summary>
    public sealed class ApiClient
    {
        private readonly string _baseUrl; // e.g. "http://localhost:8000/api/v1"

        public ApiClient(string baseUrl) => _baseUrl = baseUrl.TrimEnd('/');

        /// <summary>GET /training/{moduleKey}/pack — downloaded once over
        /// Wi-Fi and cached via Offline/TrainingPacks, per the offline-first
        /// requirement (brief section 13).</summary>
        public IEnumerator DownloadTrainingPack(string moduleKey, Action<string, string> onDone)
        {
            using var req = UnityWebRequest.Get($"{_baseUrl}/training/{moduleKey}/pack");
            yield return req.SendWebRequest();
            onDone(req.result == UnityWebRequest.Result.Success ? req.downloadHandler.text : null,
                    req.result == UnityWebRequest.Result.Success ? null : req.error);
        }

        /// <summary>POST /assessments/submit — used only while online. The
        /// identical payload, replayed later, goes through
        /// SubmitSyncBatch instead (see OfflineSyncQueue).</summary>
        public IEnumerator SubmitAttempt(string attemptSubmitJson, Action<string, string> onDone)
        {
            using var req = new UnityWebRequest($"{_baseUrl}/assessments/submit", "POST");
            var body = System.Text.Encoding.UTF8.GetBytes(attemptSubmitJson);
            req.uploadHandler = new UploadHandlerRaw(body);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();
            onDone(req.result == UnityWebRequest.Result.Success ? req.downloadHandler.text : null,
                    req.result == UnityWebRequest.Result.Success ? null : req.error);
        }

        /// <summary>POST /sync/batch — replays every attempt queued while
        /// offline. Safe to call with an already-applied batch: the
        /// backend keys idempotency on each attempt's client_attempt_id
        /// (see backend/app/services/sync_service.py).</summary>
        public IEnumerator SubmitSyncBatch(string syncBatchRequestJson, Action<string, string> onDone)
        {
            using var req = new UnityWebRequest($"{_baseUrl}/sync/batch", "POST");
            var body = System.Text.Encoding.UTF8.GetBytes(syncBatchRequestJson);
            req.uploadHandler = new UploadHandlerRaw(body);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();
            onDone(req.result == UnityWebRequest.Result.Success ? req.downloadHandler.text : null,
                    req.result == UnityWebRequest.Result.Success ? null : req.error);
        }

        /// <summary>GET /verify/{certificateNumber} — public, no auth
        /// header needed. Used by the supervisor app's QR scanner.</summary>
        public IEnumerator VerifyCertificate(string certificateNumber, Action<string, string> onDone)
        {
            // Note: mounted at the API root, not under /api/v1 — see
            // backend/app/main.py's public_router.
            var rootUrl = _baseUrl.EndsWith("/api/v1") ? _baseUrl[..^"/api/v1".Length] : _baseUrl;
            using var req = UnityWebRequest.Get($"{rootUrl}/verify/{UnityWebRequest.EscapeURL(certificateNumber)}");
            yield return req.SendWebRequest();
            onDone(req.result == UnityWebRequest.Result.Success ? req.downloadHandler.text : null,
                    req.result == UnityWebRequest.Result.Success ? null : req.error);
        }
    }
}
