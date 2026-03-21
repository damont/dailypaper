import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from api.schemas.orm.page import Page
from api.schemas.orm.page_content import PageContent
from api.schemas.dto.page import PageCreate, PageUpdate, PageResponse
from api.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def page_to_response(page: Page) -> PageResponse:
    return PageResponse(
        id=str(page.id),
        name=page.name,
        slug=page.slug,
        display_order=page.display_order,
    )


@router.get("/", response_model=list[PageResponse])
async def list_pages(user=Depends(get_current_user)):
    pages = await Page.find(
        Page.user_id == str(user.id)
    ).sort("+display_order").to_list()
    return [page_to_response(p) for p in pages]


@router.post("/", response_model=PageResponse, status_code=201)
async def create_page(data: PageCreate, user=Depends(get_current_user)):
    existing = await Page.find_one(
        Page.user_id == str(user.id), Page.slug == data.slug
    )
    if existing:
        raise HTTPException(status_code=409, detail="Page slug already exists")
    page = Page(
        name=data.name,
        slug=data.slug,
        user_id=str(user.id),
        display_order=data.display_order,
    )
    await page.insert()
    logger.info("Page '%s' created by user %s", page.slug, user.id)
    return page_to_response(page)


@router.put("/{slug}", response_model=PageResponse)
async def update_page(slug: str, data: PageUpdate, user=Depends(get_current_user)):
    page = await Page.find_one(
        Page.user_id == str(user.id), Page.slug == slug
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    if data.name is not None:
        page.name = data.name
    if data.display_order is not None:
        page.display_order = data.display_order
    page.updated_at = datetime.now(timezone.utc)
    await page.save()
    return page_to_response(page)


@router.delete("/{slug}", status_code=204)
async def delete_page(slug: str, user=Depends(get_current_user)):
    page = await Page.find_one(
        Page.user_id == str(user.id), Page.slug == slug
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    await PageContent.find(
        PageContent.user_id == str(user.id), PageContent.page_slug == slug
    ).delete()
    await page.delete()
    logger.info("Page '%s' deleted by user %s", slug, user.id)
