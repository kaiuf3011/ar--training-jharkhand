from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.auth import LoginRequest, RegisterAdminRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, body.email, body.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, role=user.role.value, display_name=user.display_name)


@router.post("/register-admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_admin(body: RegisterAdminRequest, db: Session = Depends(get_db)):
    """Open only for bootstrapping the very first admin account on a fresh
    database (see README — this is the intended one-time setup step, not a
    general public sign-up route)."""
    from app.models.user import User

    if db.query(User).filter_by(role=UserRole.ADMIN).count() > 0:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "An admin account already exists — use /auth/login.")
    user = auth_service.create_user(db, email=body.email, password=body.password, display_name=body.display_name, role=UserRole.ADMIN)
    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, role=user.role.value, display_name=user.display_name)


@router.post("/register-supervisor", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_supervisor(body: RegisterAdminRequest, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    user = auth_service.create_user(db, email=body.email, password=body.password, display_name=body.display_name, role=UserRole.SUPERVISOR)
    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, role=user.role.value, display_name=user.display_name)
