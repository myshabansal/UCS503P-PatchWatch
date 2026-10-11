from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    total_deps: Mapped[int] = mapped_column(Integer, default=0)
    skipped_deps: Mapped[int] = mapped_column(Integer, default=0)
    vulnerable_deps: Mapped[int] = mapped_column(Integer, default=0)
    critical: Mapped[int] = mapped_column(Integer, default=0)
    high: Mapped[int] = mapped_column(Integer, default=0)
    medium: Mapped[int] = mapped_column(Integer, default=0)
    low: Mapped[int] = mapped_column(Integer, default=0)

    findings: Mapped[list["Finding"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"))
    package: Mapped[str] = mapped_column(String(255))
    version: Mapped[str] = mapped_column(String(64))
    vuln_id: Mapped[str] = mapped_column(String(64))
    summary: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String(16), default="UNKNOWN")
    fixed_versions: Mapped[str] = mapped_column(String(255), default="")
    aliases: Mapped[str] = mapped_column(String(255), default="")

    scan: Mapped[Scan] = relationship(back_populates="findings")
