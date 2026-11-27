using System;
using System.Collections.Generic;

namespace JharkhandSafetyAR.Scenarios
{
    /// <summary>
    /// Mirrors the JSON shape stored in the backend's `scenarios.config`
    /// column (see backend/app/models/training.py::Scenario and the seed
    /// data in backend/app/db/seed.py — FIRE_SCENARIO_CONFIG /
    /// GAS_SCENARIO_CONFIG). Deserialize a downloaded TrainingPack's
    /// scenario.config into this shape (e.g. via Unity's JsonUtility or
    /// Newtonsoft.Json) rather than hard-coding objectives/hazards per
    /// scenario in C# — brief section 12's "data-driven, not hard-coded
    /// into individual scripts" requirement.
    /// </summary>
    [Serializable]
    public sealed class ScenarioDefinition
    {
        public string[] objectives;
        public HazardSpec[] hazards;
        public string[] interactables;
        public Dictionary<string, string> branching;
        public ScoringWeights scoring_weights;
    }

    [Serializable]
    public sealed class HazardSpec
    {
        public string type;      // e.g. "electrical_fire", "toxic_gas_leak"
        public string location;  // free-text, shown in the mission briefing
    }

    [Serializable]
    public sealed class ScoringWeights
    {
        public int knowledge;     // /30
        public int ar_actions;    // /40
        public int procedure;     // /20
        public int response_time; // /10
    }

    /// <summary>One logged practical action — the exact shape POSTed to
    /// /api/v1/assessments/submit as AttemptSubmit.actions[i] (see
    /// backend/app/schemas/assessment.py::ActionIn). Every AR mission
    /// script appends one of these per interaction; nothing about scoring
    /// lives in this class — that stays server-side in
    /// backend/app/services/scoring.py so a device can't award itself
    /// points a re-score would disagree with.</summary>
    [Serializable]
    public sealed class LoggedAction
    {
        public string key;
        public string label;
        public int tries = 1;
        public int violations;
        public bool correct;
    }
}
