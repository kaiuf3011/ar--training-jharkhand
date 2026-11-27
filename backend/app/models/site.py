from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamped, UUIDPk


class Site(Base, UUIDPk, Timestamped):
    __tablename__ = "sites"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    site_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Coal mining", "Steel"
    district: Mapped[str] = mapped_column(String(100), nullable=False)

    workers: Mapped[list["Worker"]] = relationship(back_populates="site")
