using System;
using System.Collections.Generic;

namespace JharkhandSafetyAR.Offline
{
    /// <summary>
    /// Offline-first queue contract (brief section 13). A concrete
    /// implementation persists <see cref="QueuedAttempt"/> rows to a local
    /// SQLite file (e.g. via the SQLite4Unity3d plugin) so a completed
    /// assessment survives an app kill, not just a network drop.
    ///
    /// The idempotency guarantee this depends on is real and already
    /// tested server-side: each attempt gets one client-generated
    /// <see cref="QueuedAttempt.ClientAttemptId"/> (a UUID, minted at
    /// attempt start, not at sync time), and POSTing the same id twice —
    /// e.g. because a sync was retried after a dropped connection — is a
    /// documented no-op (see
    /// backend/tests/test_vertical_slice.py::test_sync_batch_applies_new_and_flags_duplicate_together).
    /// No implementation of local persistence exists in this build — this
    /// is the interface a Unity engineer implements against.
    /// </summary>
    public interface IOfflineSyncQueue
    {
        void Enqueue(QueuedAttempt attempt);
        IReadOnlyList<QueuedAttempt> PendingAttempts();
        void MarkApplied(string clientAttemptId, string certificateNumber);
        void MarkFailed(string clientAttemptId, string error);
        int PendingCount { get; }
    }

    [Serializable]
    public sealed class QueuedAttempt
    {
        public string ClientAttemptId; // UUID, minted on-device at attempt start
        public string WorkerCode;
        public string ModuleKey;
        public string AttemptSubmitJson; // full AttemptSubmit payload, pre-serialized
        public DateTime QueuedAtUtc;
        public int RetryCount;
    }
}
