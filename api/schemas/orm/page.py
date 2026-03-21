from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class Page(Document):
    name: str
    slug: Indexed(str)
    user_id: Indexed(str)
    display_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "pages"
        indexes = [
            [("user_id", 1), ("slug", 1)],
        ]
