from typing import Optional
from pydantic import BaseModel


class PageCreate(BaseModel):
    name: str
    slug: str
    display_order: int = 0


class PageUpdate(BaseModel):
    name: Optional[str] = None
    display_order: Optional[int] = None


class PageResponse(BaseModel):
    id: str
    name: str
    slug: str
    display_order: int
