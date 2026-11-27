from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteOut

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[SiteOut])
def list_sites(db: Session = Depends(get_db)):
    return db.query(Site).order_by(Site.name).all()


@router.post("", response_model=SiteOut, status_code=201)
def create_site(body: SiteCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    site = Site(**body.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site
