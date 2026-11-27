from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.localization import Localization

router = APIRouter(prefix="/localization", tags=["localization"])


@router.get("/{locale}")
def get_locale_strings(locale: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Flat key -> string map for one locale, fetched once and cached
    on-device — the same shape the frontend's I18N.en/hi/sat objects
    already use, so this can replace the hard-coded object without
    changing any call site, only where the data comes from."""
    rows = db.query(Localization).filter_by(locale=locale).all()
    return {r.key: r.value for r in rows}


@router.get("/coverage/report")
def coverage_report(db: Session = Depends(get_db)) -> dict[str, dict[str, int]]:
    """Per-locale counts by status — backs the admin Localization screen's
    coverage tiles instead of the hard-coded LOC object in console.js."""
    rows = db.query(Localization).all()
    out: dict[str, dict[str, int]] = {}
    for r in rows:
        out.setdefault(r.locale, {"complete": 0, "review": 0, "missing": 0})
        out[r.locale][r.status] = out[r.locale].get(r.status, 0) + 1
    return out
