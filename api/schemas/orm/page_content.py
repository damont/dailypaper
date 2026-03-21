import uuid
from datetime import date, datetime, timezone
from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class Story(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    body: str
    image_key: Optional[str] = None
    link: Optional[str] = None
    priority: str = "medium"  # "high", "medium", "low"
    position: int = 0


class PageContent(Document):
    user_id: Indexed(str)
    page_slug: str
    edition_date: date
    headline: Optional[str] = None
    stories: list[Story] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "page_contents"
        indexes = [
            [("user_id", 1), ("page_slug", 1), ("edition_date", 1)],
        ]
