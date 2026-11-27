using System.Collections.Generic;

namespace JharkhandSafetyAR.Vision
{
    /// <summary>
    /// Pluggable on-device computer-vision interface (brief section 7).
    ///
    /// STATUS: contract only — <see cref="MockVisionDetector"/> below is the
    /// only implementation that exists. Nothing in this codebase performs
    /// real object detection. Any UI string describing detector output MUST
    /// say "TRAINING VISION DETECTION", never "certified fire detector" or
    /// similar (brief section 6) — this is an educational simulator, not a
    /// life-safety device, and the interface is deliberately named to make
    /// that distinction impossible to paper over: implementations return a
    /// <see cref="DetectionResult.Source"/> tag that callers must surface.
    /// </summary>
    public interface IVisionDetector
    {
        void Initialize(VisionDetectorConfig config);
        void ProcessFrame(CameraFrame frame);
        IReadOnlyList<DetectionResult> DetectObjects();
        void Shutdown();
    }

    public enum DetectionSource
    {
        /// <summary>No real inference — a scripted/mock result. This is the
        /// only source that exists in this build.</summary>
        Mock,
        /// <summary>A real on-device model (ONNX Runtime / TFLite) actually
        /// ran. Not implemented in this build.</summary>
        OnDeviceModel,
    }

    public readonly struct VisionDetectorConfig
    {
        public readonly float ConfidenceThreshold;
        public readonly string[] EnabledClasses;

        public VisionDetectorConfig(float confidenceThreshold, string[] enabledClasses)
        {
            ConfidenceThreshold = confidenceThreshold;
            EnabledClasses = enabledClasses;
        }
    }

    /// <summary>Opaque handle to one camera frame. A real implementation
    /// would wrap the platform's `XRCpuImage` / `ARCameraFrameEventArgs`;
    /// this build never populates real pixel data.</summary>
    public readonly struct CameraFrame
    {
        public readonly long TimestampMs;
        public CameraFrame(long timestampMs) => TimestampMs = timestampMs;
    }

    public readonly struct BoundingBox
    {
        public readonly float X, Y, Width, Height; // normalized 0-1
        public BoundingBox(float x, float y, float width, float height)
        {
            X = x; Y = y; Width = width; Height = height;
        }
    }

    public readonly struct DetectionResult
    {
        public readonly string ClassName;   // e.g. "extinguisher", "helmet", "exit_sign"
        public readonly float Confidence;   // 0-1
        public readonly BoundingBox Box;
        public readonly DetectionSource Source;

        public DetectionResult(string className, float confidence, BoundingBox box, DetectionSource source)
        {
            ClassName = className;
            Confidence = confidence;
            Box = box;
            Source = source;
        }
    }

    /// <summary>
    /// MOCK_VISION_DETECTOR — always returns DetectionSource.Mock results.
    /// Exists so the scenario/interaction layer can be built and tested
    /// against a stable interface before any real model is trained. Swap
    /// for a real <see cref="IVisionDetector"/> implementation without
    /// touching any caller — that's the point of the interface.
    /// </summary>
    public sealed class MockVisionDetector : IVisionDetector
    {
        private VisionDetectorConfig _config;

        public void Initialize(VisionDetectorConfig config) => _config = config;

        public void ProcessFrame(CameraFrame frame)
        {
            // Intentionally does nothing — there is no real frame pipeline.
        }

        public IReadOnlyList<DetectionResult> DetectObjects()
        {
            // Deterministic, scripted stand-in so downstream code has
            // something to render/react to during development. Never
            // presented to a user as a live detection.
            return new List<DetectionResult>
            {
                new DetectionResult("extinguisher", 0.92f, new BoundingBox(0.4f, 0.5f, 0.1f, 0.2f), DetectionSource.Mock),
            };
        }

        public void Shutdown() { }
    }
}
