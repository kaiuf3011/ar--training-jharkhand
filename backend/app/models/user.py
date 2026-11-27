import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    WORKER = "worker"


class User(Base, UUIDPk, Timestamped):
    """Authentication identity. A Worker profile is a separate row (workers
    can exist — and train offline — before any account is ever synced), and
    is linked here only once the worker registers/syncs online."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)

    worker: Mapped["Worker | None"] = relationship(back_populates="user", uselist=False)
