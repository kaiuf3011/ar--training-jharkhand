from datetime import datetime, timezone


def as_aware_utc(dt: datetime) -> datetime:
    """SQLite does not round-trip timezone-aware datetimes — a value stored
    as UTC-aware comes back naive on read. Postgres does not have this
    problem, but code needs to work on both, so every comparison against
    `datetime.now(timezone.utc)` goes through this first."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
