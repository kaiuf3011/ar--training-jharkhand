from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter_by(email=email).first()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def issue_token(user: User) -> str:
    return create_access_token(subject=user.id, role=user.role.value, extra={"email": user.email})


def create_user(db: Session, *, email: str, password: str, display_name: str, role: UserRole) -> User:
    user = User(email=email, password_hash=hash_password(password), display_name=display_name, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
