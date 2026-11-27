from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, id: str, role: str, email: str):
        self.id = id
        self.role = role
        self.email = email


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        payload = decode_access_token(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return CurrentUser(id=payload["sub"], role=payload["role"], email=payload.get("email", ""))


def require_roles(*roles: str) -> Callable[[CurrentUser], CurrentUser]:
    def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires role in {roles}")
        return user

    return checker


require_admin = require_roles("admin")
require_admin_or_supervisor = require_roles("admin", "supervisor")
