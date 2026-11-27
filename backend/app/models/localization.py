from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class Localization(Base, UUIDPk, Timestamped):
    """Key/value translation store, deliberately data-only — never
    hard-coded into application or frontend code — so a translator or the
    admin Localization screen can add/edit strings without a deploy."""

    __tablename__ = "localizations"
    __table_args__ = (UniqueConstraint("locale", "key", name="uq_locale_key"),)

    locale: Mapped[str] = mapped_column(String(8), nullable=False)  # en | hi | sat
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    value: Mapped[str] = mapped_column(String(2000), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="complete")  # complete|review|missing
