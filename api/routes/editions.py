from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from api.schemas.orm.page import Page
from api.schemas.orm.page_content import PageContent
from api.schemas.dto.content import (
    StoryResponse, EditionPageResponse, EditionResponse, EditionDateResponse,
)
from api.routes.content import story_to_response
from api.utils.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=EditionResponse)
async def get_edition(
    edition_date: Optional[date] = Query(None, alias="date"),
    user=Depends(get_current_user),
):
    target_date = edition_date or date.today()
    contents = await PageContent.find(
        PageContent.user_id == str(user.id),
        PageContent.edition_date == target_date,
    ).to_list()

    if not contents:
        return EditionResponse(date=target_date.isoformat(), pages=[])

    page_slugs = [pc.page_slug for pc in contents]
    pages = await Page.find(
        Page.user_id == str(user.id),
        {"slug": {"$in": page_slugs}},
    ).sort("+display_order").to_list()

    page_map = {p.slug: p for p in pages}
    content_map = {pc.page_slug: pc for pc in contents}

    edition_pages = []
    for page in pages:
        pc = content_map.get(page.slug)
        if pc and pc.stories:
            edition_pages.append(EditionPageResponse(
                page_slug=page.slug,
                page_name=page.name,
                display_order=page.display_order,
                headline=pc.headline,
                stories=[story_to_response(s) for s in pc.stories],
            ))

    return EditionResponse(date=target_date.isoformat(), pages=edition_pages)


@router.get("/dates", response_model=EditionDateResponse)
async def list_edition_dates(user=Depends(get_current_user)):
    contents = await PageContent.find(
        PageContent.user_id == str(user.id),
    ).to_list()
    seen = set()
    dates = []
    for pc in contents:
        d = pc.edition_date
        d_str = d.isoformat() if hasattr(d, "isoformat") else str(d)
        if d_str not in seen:
            seen.add(d_str)
            dates.append(d_str)
    dates.sort(reverse=True)
    return EditionDateResponse(dates=dates[:90])
