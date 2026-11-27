using System;

namespace JharkhandSafetyAR.AR
{
    /// <summary>
    /// The AR/VR abstraction boundary (brief section 2). Scenario,
    /// interaction and assessment code depend on this interface ONLY —
    /// never on ARSession/ARPlaneManager or an eventual XRSession
    /// directly. An AR Foundation implementation (the actual target for
    /// this hackathon) and a future VR/XR implementation both satisfy the
    /// same contract, so nothing above this line needs to change to add
    /// VR later. No VR implementation exists in this build — AR is the
    /// only supported runtime, per the brief's explicit "VR must not
    /// become a requirement" instruction.
    /// </summary>
    public interface IRuntimeAdapter
    {
        RuntimeCapabilities Capabilities { get; }

        void BeginCalibration(Action<CalibrationResult> onComplete);
        SpatialAnchorHandle PlaceAnchor(Pose worldPose);
        void RemoveAnchor(SpatialAnchorHandle handle);
    }

    /// <summary>Environment-understanding tier actually available on this
    /// device, per brief section 3's graceful-degradation requirement.</summary>
    public enum EnvironmentDetail
    {
        PlaneOnly,      // ARCore/ARKit plane detection only
        DepthAssisted,  // depth API available, no full scene mesh
        LiDARScene,     // LiDAR-capable iOS device — full scene mesh + occlusion
    }

    public readonly struct RuntimeCapabilities
    {
        public readonly EnvironmentDetail EnvironmentDetail;
        public readonly bool SupportsOcclusion;
        public readonly bool SupportsMeshing;

        public RuntimeCapabilities(EnvironmentDetail detail, bool occlusion, bool meshing)
        {
            EnvironmentDetail = detail;
            SupportsOcclusion = occlusion;
            SupportsMeshing = meshing;
        }
    }

    public readonly struct CalibrationResult
    {
        public readonly bool Success;
        public readonly int PlanesDetected;
        public readonly string FailureReason;

        public CalibrationResult(bool success, int planesDetected, string failureReason)
        {
            Success = success;
            PlanesDetected = planesDetected;
            FailureReason = failureReason;
        }
    }

    public readonly struct Pose
    {
        public readonly float X, Y, Z;
        public Pose(float x, float y, float z) { X = x; Y = y; Z = z; }
    }

    public readonly struct SpatialAnchorHandle
    {
        public readonly string Id;
        public SpatialAnchorHandle(string id) => Id = id;
    }
}
