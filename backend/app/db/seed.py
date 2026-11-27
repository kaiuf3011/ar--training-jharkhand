"""
Seed data for local dev / demo: the 6 sites and 5 training modules already
shown in the frontend prototype, the 3-question banks per live module
(fire, gas — mirroring prototype/worker.js's QUIZ object), one demo admin
account, and one demo worker so the vertical slice is runnable immediately
after `python -m app.db.seed`.

This is idempotent: re-running it does not duplicate rows.
"""
from __future__ import annotations

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.localization import Localization
from app.models.site import Site
from app.models.training import Question, Scenario, TrainingModule
from app.models.user import User, UserRole
from app.models.worker import Worker

import app.models  # noqa: F401

SITES = [
    ("Dhanbad Mine", "Coal mining", "Dhanbad"),
    ("Bokaro Steel", "Steel", "Bokaro"),
    ("Jamshedpur Facility", "Manufacturing", "East Singhbhum"),
    ("Mica Processing", "Mica processing", "Koderma"),
    ("Hazaribagh Colliery", "Coal mining", "Hazaribagh"),
    ("Ramgarh Washery", "Coal washery", "Ramgarh"),
]

MODULES = [
    ("fire", "Fire & Explosion Response", "published", "FR", 365, 70),
    ("gas", "Gas Leak & Confined Space", "published", "GS", 365, 70),
    ("mach", "Machinery Safety", "draft", "MS", 365, 70),
    ("elec", "Electrical Safety", "draft", "ES", 365, 70),
    ("ppe", "PPE & General Safety", "draft", "PS", 365, 70),
]

FIRE_QUESTIONS = [
    (
        "Which extinguisher is preferred for a fire on energized electrical equipment?",
        ["CO₂", "Water", "Foam", "Sand bucket"],
        0,
        "CO₂ does not conduct electricity and leaves no residue on equipment.",
    ),
    (
        'You discover a fire. What do you do first?',
        ["Collect your belongings", 'Raise the alarm — shout "Fire" and press the call point', "Open windows for ventilation", "Keep working until told"],
        1,
        "Raising the alarm first gets everyone moving and starts the emergency response.",
    ),
    (
        "During evacuation you should…",
        ["Use the lift to get out faster", "Go back for your tools", "Use the nearest safe exit and go to the assembly point", "Wait at your workstation"],
        2,
        "Never use lifts or return for belongings. Report at the assembly point for the head count.",
    ),
]

GAS_QUESTIONS = [
    (
        "The safe oxygen range for confined-space entry is…",
        ["15 – 19 %", "19.5 – 23.5 %", "10 – 15 %", "Above 25 %"],
        1,
        "Below 19.5% is oxygen-deficient; above 23.5% is an enrichment fire risk.",
    ),
    (
        "Before entering a confined space you must have…",
        ["Only a helmet", "Verbal OK from anyone nearby", "A valid permit, a gas test and an attendant outside", "Nothing, if the job is short"],
        2,
        "Permit-to-work, atmospheric testing and a trained attendant are mandatory for every entry.",
    ),
    (
        "Your buddy collapses inside a confined space. You should…",
        ["Raise the alarm and do not enter without SCBA", "Enter immediately and pull them out", "Wait and watch", "Pour water into the space"],
        0,
        "Most confined-space deaths are would-be rescuers. Only a trained team with SCBA enters.",
    ),
]

# Data-driven scenario config — objectives/hazards/interactables/scoring,
# consumed by whatever runtime renders it (see docs/UNITY_INTEGRATION.md).
FIRE_SCENARIO_CONFIG = {
    "objectives": ["Identify the hazard", "Locate the emergency exit", "Select the appropriate extinguisher", "Follow the evacuation sequence", "Reach the assembly point"],
    "hazards": [{"type": "electrical_fire", "location": "MCC-3 panel"}],
    "interactables": ["fire_source", "co2_extinguisher", "water_extinguisher", "foam_extinguisher", "exit_a", "exit_b", "assembly_point"],
    "branching": {"variant_a": "Exit A clear, Exit B smoke-blocked", "variant_b": "Exit B clear, Exit A smoke-blocked"},
    "scoring_weights": {"knowledge": 30, "ar_actions": 40, "procedure": 20, "response_time": 10},
}
GAS_SCENARIO_CONFIG = {
    "objectives": ["Detect hazard zone", "Identify unsafe entry", "Select correct PPE", "Establish buddy system", "Follow safe communication protocol"],
    "hazards": [{"type": "toxic_gas_leak", "location": "Confined space CS-07"}],
    "interactables": ["gas_source", "ppe_station", "buddy_marker", "comms_radio", "entry_point"],
    "branching": {"emergency_escalation": "Gas level critical mid-scenario"},
    "scoring_weights": {"knowledge": 30, "ar_actions": 40, "procedure": 20, "response_time": 10},
}

LOCALIZATION_SEED = [
    ("en", "choose_lang", "Choose your language", "complete"),
    ("hi", "choose_lang", "भाषा चुनें", "complete"),
    ("sat", "choose_lang", "ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ", "complete"),
    ("en", "m_fire", "Fire & Explosion Response", "complete"),
    ("hi", "m_fire", "आग और विस्फोट प्रतिक्रिया", "complete"),
    ("sat", "m_fire", "ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱵᱤᱥᱯᱷᱚᱴ", "complete"),
    ("en", "m_gas", "Gas Leak & Confined Space", "complete"),
    ("hi", "m_gas", "गैस रिसाव और सीमित स्थान", "complete"),
    ("sat", "m_gas", "ᱜᱮᱥ ᱞᱤᱠ ᱟᱨ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ", "review"),
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        sites_by_name = {s.name: s for s in db.query(Site).all()}
        for name, site_type, district in SITES:
            if name not in sites_by_name:
                db.add(Site(name=name, site_type=site_type, district=district))
        db.commit()
        sites_by_name = {s.name: s for s in db.query(Site).all()}

        modules_by_key = {m.key: m for m in db.query(TrainingModule).all()}
        for key, name, status, prefix, validity, pass_mark in MODULES:
            if key not in modules_by_key:
                db.add(TrainingModule(key=key, name=name, status=status, certificate_prefix=prefix, validity_days=validity, pass_mark=pass_mark))
        db.commit()
        modules_by_key = {m.key: m for m in db.query(TrainingModule).all()}

        for module_key, questions, scenario_key, scenario_title, config in (
            ("fire", FIRE_QUESTIONS, "fire_mcc3", "Electrical Fire — MCC Room 3", FIRE_SCENARIO_CONFIG),
            ("gas", GAS_QUESTIONS, "gas_cs07", "Gas Leak — Confined Space CS-07", GAS_SCENARIO_CONFIG),
        ):
            module = modules_by_key[module_key]
            if db.query(Question).filter_by(module_id=module.id).count() == 0:
                for text, options, correct_index, explanation in questions:
                    db.add(
                        Question(
                            module_id=module.id,
                            text_en=text,
                            options=[{"en": o} for o in options],
                            correct_index=correct_index,
                            explanation_en=explanation,
                        )
                    )
            if db.query(Scenario).filter_by(module_id=module.id, key=scenario_key).count() == 0:
                db.add(Scenario(module_id=module.id, key=scenario_key, title=scenario_title, config=config))
        db.commit()

        for locale, key, value, status in LOCALIZATION_SEED:
            exists = db.query(Localization).filter_by(locale=locale, key=key).first()
            if exists is None:
                db.add(Localization(locale=locale, key=key, value=value, status=status))
        db.commit()

        if db.query(User).filter_by(role=UserRole.ADMIN).count() == 0:
            db.add(User(email="admin@jharkhandsafetyar.example", password_hash=hash_password("ChangeMe123!"), role=UserRole.ADMIN, display_name="A. Tirkey"))
            db.commit()
            print("Seeded admin account: admin@jharkhandsafetyar.example / ChangeMe123!  (CHANGE THIS PASSWORD)")

        dhanbad = sites_by_name["Dhanbad Mine"]
        if db.query(Worker).filter_by(worker_code="JH-DHN-04821").first() is None:
            db.add(Worker(worker_code="JH-DHN-04821", full_name="Rahul Kumar", role_title="Mine Operator", experience_band="3-5 years", language="en", site_id=dhanbad.id))
            db.commit()
            print("Seeded demo worker: JH-DHN-04821 (Rahul Kumar, Dhanbad Mine)")

        print(f"Sites: {db.query(Site).count()}  Modules: {db.query(TrainingModule).count()}  Questions: {db.query(Question).count()}  Scenarios: {db.query(Scenario).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
