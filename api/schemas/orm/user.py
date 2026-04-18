from datetime import datetime, timezone
from typing import Optional

import pymongo
from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    email: Indexed(str, unique=True)
    display_name: str
    # Optional for Google-only accounts (no password set).
    hashed_password: Optional[str] = None
    newspaper_name: str = "The Daily Paper"
    # Plain string with a sparse unique index (declared in Settings.indexes)
    # so multiple users without a google_sub don't collide on None.
    google_sub: Optional[str] = None
    email_verified: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            pymongo.IndexModel(
                [("google_sub", pymongo.ASCENDING)],
                unique=True,
                sparse=True,
                name="google_sub_unique_sparse",
            ),
        ]
