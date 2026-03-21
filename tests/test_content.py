import pytest
from datetime import date, timedelta


TODAY = date.today().isoformat()
YESTERDAY = (date.today() - timedelta(days=1)).isoformat()
TOMORROW = (date.today() + timedelta(days=1)).isoformat()


@pytest.fixture
async def page_setup(authenticated_client):
    """Create a page for content tests."""
    await authenticated_client.post("/api/pages/", json={
        "name": "News", "slug": "news", "display_order": 0,
    })
    return authenticated_client


# --- Content CRUD ---

@pytest.mark.anyio
async def test_set_content(page_setup):
    client = page_setup
    res = await client.put(f"/api/pages/news/content?date={TODAY}", json={
        "headline": "Big News",
        "stories": [
            {"title": "Story 1", "body": "Body 1", "priority": "high", "position": 0},
            {"title": "Story 2", "body": "Body 2", "priority": "medium", "position": 0},
        ],
    })
    assert res.status_code == 200
    data = res.json()
    assert data["headline"] == "Big News"
    assert len(data["stories"]) == 2


@pytest.mark.anyio
async def test_get_content(page_setup):
    client = page_setup
    await client.put(f"/api/pages/news/content?date={TODAY}", json={
        "headline": "Today",
        "stories": [{"title": "S1", "body": "B1", "priority": "high", "position": 0}],
    })
    res = await client.get(f"/api/pages/news/content?date={TODAY}")
    assert res.status_code == 200
    assert res.json()["headline"] == "Today"
    assert len(res.json()["stories"]) == 1


@pytest.mark.anyio
async def test_get_content_empty(page_setup):
    client = page_setup
    res = await client.get(f"/api/pages/news/content?date={TODAY}")
    assert res.status_code == 200
    assert res.json()["stories"] == []


@pytest.mark.anyio
async def test_get_content_nonexistent_page(authenticated_client):
    res = await authenticated_client.get(f"/api/pages/nope/content?date={TODAY}")
    assert res.status_code == 404


@pytest.mark.anyio
async def test_replace_content(page_setup):
    client = page_setup
    await client.put(f"/api/pages/news/content?date={TODAY}", json={
        "headline": "V1",
        "stories": [{"title": "Old", "body": "Old body", "priority": "high", "position": 0}],
    })
    res = await client.put(f"/api/pages/news/content?date={TODAY}", json={
        "headline": "V2",
        "stories": [{"title": "New", "body": "New body", "priority": "low", "position": 0}],
    })
    assert res.status_code == 200
    assert res.json()["headline"] == "V2"
    assert res.json()["stories"][0]["title"] == "New"


# --- Date immutability ---

@pytest.mark.anyio
async def test_reject_past_date_content(page_setup):
    client = page_setup
    res = await client.put(f"/api/pages/news/content?date={YESTERDAY}", json={
        "headline": "Old",
        "stories": [],
    })
    assert res.status_code == 400
    assert "past" in res.json()["detail"].lower()


@pytest.mark.anyio
async def test_allow_future_date_content(page_setup):
    client = page_setup
    res = await client.put(f"/api/pages/news/content?date={TOMORROW}", json={
        "headline": "Tomorrow's News",
        "stories": [{"title": "Future", "body": "Coming soon", "priority": "high", "position": 0}],
    })
    assert res.status_code == 200
    assert res.json()["headline"] == "Tomorrow's News"


# --- Story operations ---

@pytest.mark.anyio
async def test_add_story(page_setup):
    client = page_setup
    res = await client.post(f"/api/pages/news/content/stories?date={TODAY}", json={
        "title": "Added Story",
        "body": "Added body",
        "priority": "medium",
        "position": 0,
    })
    assert res.status_code == 201
    assert res.json()["title"] == "Added Story"
    assert "id" in res.json()


@pytest.mark.anyio
async def test_update_story(page_setup):
    client = page_setup
    # Add a story
    add_res = await client.post(f"/api/pages/news/content/stories?date={TODAY}", json={
        "title": "Original",
        "body": "Original body",
        "priority": "medium",
        "position": 0,
    })
    story_id = add_res.json()["id"]

    # Update it
    res = await client.put(f"/api/pages/news/content/stories/{story_id}?date={TODAY}", json={
        "title": "Updated",
    })
    assert res.status_code == 200
    assert res.json()["title"] == "Updated"
    assert res.json()["body"] == "Original body"  # unchanged


@pytest.mark.anyio
async def test_delete_story(page_setup):
    client = page_setup
    add_res = await client.post(f"/api/pages/news/content/stories?date={TODAY}", json={
        "title": "To Delete",
        "body": "Gone soon",
        "priority": "low",
        "position": 0,
    })
    story_id = add_res.json()["id"]

    res = await client.delete(f"/api/pages/news/content/stories/{story_id}?date={TODAY}")
    assert res.status_code == 204

    # Verify it's gone
    content = await client.get(f"/api/pages/news/content?date={TODAY}")
    assert all(s["id"] != story_id for s in content.json()["stories"])


@pytest.mark.anyio
async def test_delete_nonexistent_story(page_setup):
    client = page_setup
    res = await client.delete(f"/api/pages/news/content/stories/fake-id?date={TODAY}")
    assert res.status_code == 404


@pytest.mark.anyio
async def test_reject_past_date_story_add(page_setup):
    client = page_setup
    res = await client.post(f"/api/pages/news/content/stories?date={YESTERDAY}", json={
        "title": "Late",
        "body": "Too late",
        "priority": "low",
        "position": 0,
    })
    assert res.status_code == 400


@pytest.mark.anyio
async def test_reject_past_date_story_delete(page_setup):
    client = page_setup
    res = await client.delete(f"/api/pages/news/content/stories/any-id?date={YESTERDAY}")
    assert res.status_code == 400


# --- Story priority ---

@pytest.mark.anyio
async def test_story_priorities(page_setup):
    client = page_setup
    await client.put(f"/api/pages/news/content?date={TODAY}", json={
        "headline": "Mixed",
        "stories": [
            {"title": "High", "body": "H", "priority": "high", "position": 0},
            {"title": "Med", "body": "M", "priority": "medium", "position": 0},
            {"title": "Low", "body": "L", "priority": "low", "position": 0},
        ],
    })
    res = await client.get(f"/api/pages/news/content?date={TODAY}")
    stories = res.json()["stories"]
    priorities = [s["priority"] for s in stories]
    assert "high" in priorities
    assert "medium" in priorities
    assert "low" in priorities


# --- Story links and images ---

@pytest.mark.anyio
async def test_story_with_link(page_setup):
    client = page_setup
    res = await client.post(f"/api/pages/news/content/stories?date={TODAY}", json={
        "title": "Linked",
        "body": "Has a link",
        "link": "https://example.com/article",
        "priority": "medium",
        "position": 0,
    })
    assert res.status_code == 201
    assert res.json()["link"] == "https://example.com/article"


# --- User isolation ---

@pytest.mark.anyio
async def test_content_user_isolation(page_setup, second_user_client):
    client = page_setup
    await client.put(f"/api/pages/news/content?date={TODAY}", json={
        "headline": "Private",
        "stories": [{"title": "Secret", "body": "Shh", "priority": "high", "position": 0}],
    })

    # Second user creates their own page
    await second_user_client.post("/api/pages/", json={"name": "News", "slug": "news", "display_order": 0})
    res = await second_user_client.get(f"/api/pages/news/content?date={TODAY}")
    assert res.status_code == 200
    assert res.json()["stories"] == []
