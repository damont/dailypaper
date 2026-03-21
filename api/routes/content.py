import logging
import uuid
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from api.schemas.orm.page import Page
from api.schemas.orm.page_content import PageContent, Story
from api.schemas.dto.content import (
    StoryCreate, StoryUpdate, StoryResponse,
    PageContentUpdate, PageContentResponse,
    ImageUploadResponse,
)
from api.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def story_to_response(story: Story) -> StoryResponse:
    image_url = f"/api/images/{story.image_key}" if story.image_key else None
    return StoryResponse(
        id=story.id,
        title=story.title,
        body=story.body,
        image_url=image_url,
        link=story.link,
        priority=story.priority,
        position=story.position,
    )


def content_to_response(pc: PageContent) -> PageContentResponse:
    return PageContentResponse(
        id=str(pc.id),
        page_slug=pc.page_slug,
        edition_date=pc.edition_date.isoformat(),
        headline=pc.headline,
        stories=[story_to_response(s) for s in pc.stories],
    )


def _check_date_not_past(edition_date: date):
    if edition_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Cannot modify content for past dates",
        )


async def _get_or_create_content(
    user_id: str, slug: str, edition_date: date
) -> PageContent:
    pc = await PageContent.find_one(
        PageContent.user_id == user_id,
        PageContent.page_slug == slug,
        PageContent.edition_date == edition_date,
    )
    if not pc:
        pc = PageContent(
            user_id=user_id,
            page_slug=slug,
            edition_date=edition_date,
        )
        await pc.insert()
    return pc


async def _verify_page_exists(user_id: str, slug: str):
    page = await Page.find_one(Page.user_id == user_id, Page.slug == slug)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")


@router.get("/{slug}/content", response_model=PageContentResponse)
async def get_content(
    slug: str,
    edition_date: Optional[date] = Query(None, alias="date"),
    user=Depends(get_current_user),
):
    await _verify_page_exists(str(user.id), slug)
    target_date = edition_date or date.today()
    pc = await PageContent.find_one(
        PageContent.user_id == str(user.id),
        PageContent.page_slug == slug,
        PageContent.edition_date == target_date,
    )
    if not pc:
        return PageContentResponse(
            id="",
            page_slug=slug,
            edition_date=target_date.isoformat(),
            headline=None,
            stories=[],
        )
    return content_to_response(pc)


@router.put("/{slug}/content", response_model=PageContentResponse)
async def set_content(
    slug: str,
    data: PageContentUpdate,
    edition_date: Optional[date] = Query(None, alias="date"),
    user=Depends(get_current_user),
):
    await _verify_page_exists(str(user.id), slug)
    target_date = edition_date or date.today()
    _check_date_not_past(target_date)

    stories = [
        Story(
            id=str(uuid.uuid4()),
            title=s.title,
            body=s.body,
            image_key=s.image_key,
            link=s.link,
            priority=s.priority,
            position=s.position,
        )
        for s in data.stories
    ]

    pc = await PageContent.find_one(
        PageContent.user_id == str(user.id),
        PageContent.page_slug == slug,
        PageContent.edition_date == target_date,
    )
    if pc:
        pc.headline = data.headline
        pc.stories = stories
        pc.updated_at = datetime.now(timezone.utc)
        await pc.save()
    else:
        pc = PageContent(
            user_id=str(user.id),
            page_slug=slug,
            edition_date=target_date,
            headline=data.headline,
            stories=stories,
        )
        await pc.insert()

    logger.info(
        "Content set for page '%s' on %s by user %s (%d stories)",
        slug, target_date, user.id, len(stories),
    )
    return content_to_response(pc)


@router.post("/{slug}/content/stories", response_model=StoryResponse, status_code=201)
async def add_story(
    slug: str,
    data: StoryCreate,
    edition_date: Optional[date] = Query(None, alias="date"),
    user=Depends(get_current_user),
):
    await _verify_page_exists(str(user.id), slug)
    target_date = edition_date or date.today()
    _check_date_not_past(target_date)

    pc = await _get_or_create_content(str(user.id), slug, target_date)
    story = Story(
        id=str(uuid.uuid4()),
        title=data.title,
        body=data.body,
        image_key=data.image_key,
        link=data.link,
        priority=data.priority,
        position=data.position,
    )
    pc.stories.append(story)
    pc.updated_at = datetime.now(timezone.utc)
    await pc.save()
    return story_to_response(story)


@router.put("/{slug}/content/stories/{story_id}", response_model=StoryResponse)
async def update_story(
    slug: str,
    story_id: str,
    data: StoryUpdate,
    edition_date: Optional[date] = Query(None, alias="date"),
    user=Depends(get_current_user),
):
    await _verify_page_exists(str(user.id), slug)
    target_date = edition_date or date.today()
    _check_date_not_past(target_date)

    pc = await PageContent.find_one(
        PageContent.user_id == str(user.id),
        PageContent.page_slug == slug,
        PageContent.edition_date == target_date,
    )
    if not pc:
        raise HTTPException(status_code=404, detail="No content for this date")

    story = next((s for s in pc.stories if s.id == story_id), None)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(story, key, value)
    pc.updated_at = datetime.now(timezone.utc)
    await pc.save()
    return story_to_response(story)


@router.delete("/{slug}/content/stories/{story_id}", status_code=204)
async def delete_story(
    slug: str,
    story_id: str,
    edition_date: Optional[date] = Query(None, alias="date"),
    user=Depends(get_current_user),
):
    await _verify_page_exists(str(user.id), slug)
    target_date = edition_date or date.today()
    _check_date_not_past(target_date)

    pc = await PageContent.find_one(
        PageContent.user_id == str(user.id),
        PageContent.page_slug == slug,
        PageContent.edition_date == target_date,
    )
    if not pc:
        raise HTTPException(status_code=404, detail="No content for this date")

    original_len = len(pc.stories)
    pc.stories = [s for s in pc.stories if s.id != story_id]
    if len(pc.stories) == original_len:
        raise HTTPException(status_code=404, detail="Story not found")
    pc.updated_at = datetime.now(timezone.utc)
    await pc.save()
