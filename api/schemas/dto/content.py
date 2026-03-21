from typing import Optional
from pydantic import BaseModel


class StoryCreate(BaseModel):
    title: str
    body: str
    image_key: Optional[str] = None
    link: Optional[str] = None
    priority: str = "medium"
    position: int = 0


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    image_key: Optional[str] = None
    link: Optional[str] = None
    priority: Optional[str] = None
    position: Optional[int] = None


class StoryResponse(BaseModel):
    id: str
    title: str
    body: str
    image_url: Optional[str]
    link: Optional[str]
    priority: str
    position: int


class PageContentUpdate(BaseModel):
    headline: Optional[str] = None
    stories: list[StoryCreate]


class PageContentResponse(BaseModel):
    id: str
    page_slug: str
    edition_date: str
    headline: Optional[str]
    stories: list[StoryResponse]


class EditionPageResponse(BaseModel):
    page_slug: str
    page_name: str
    display_order: int
    headline: Optional[str]
    stories: list[StoryResponse]


class EditionResponse(BaseModel):
    date: str
    pages: list[EditionPageResponse]


class EditionDateResponse(BaseModel):
    dates: list[str]


class ImageUploadResponse(BaseModel):
    image_key: str
