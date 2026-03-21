import pytest
from datetime import date


TODAY = date.today().isoformat()


@pytest.fixture
async def edition_setup(authenticated_client):
    """Create pages and push content for edition tests."""
    client = authenticated_client
    await client.post("/api/pages/", json={"name": "News", "slug": "news", "display_order": 0})
    await client.post("/api/pages/", json={"name": "Sports", "slug": "sports", "display_order": 1})
    await client.post("/api/pages/", json={"name": "Weather", "slug": "weather", "display_order": 2})

    # Push content to news and sports only
    await client.put(f"/api/pages/news/content?date={TODAY}", json={
        "headline": "Top News",
        "stories": [
            {"title": "Main", "body": "Main story", "priority": "high", "position": 0},
        ],
    })
    await client.put(f"/api/pages/sports/content?date={TODAY}", json={
        "headline": "Sports Round-up",
        "stories": [
            {"title": "Game Result", "body": "Team won", "priority": "medium", "position": 0},
        ],
    })
    return client


@pytest.mark.anyio
async def test_get_edition(edition_setup):
    client = edition_setup
    res = await client.get(f"/api/editions/?date={TODAY}")
    assert res.status_code == 200
    data = res.json()
    assert data["date"] == TODAY
    # Only pages with content should appear
    assert len(data["pages"]) == 2
    slugs = [p["page_slug"] for p in data["pages"]]
    assert "news" in slugs
    assert "sports" in slugs
    assert "weather" not in slugs  # no content


@pytest.mark.anyio
async def test_edition_page_order(edition_setup):
    client = edition_setup
    res = await client.get(f"/api/editions/?date={TODAY}")
    pages = res.json()["pages"]
    # Should be sorted by display_order
    assert pages[0]["page_slug"] == "news"
    assert pages[1]["page_slug"] == "sports"


@pytest.mark.anyio
async def test_edition_empty_date(authenticated_client):
    res = await authenticated_client.get("/api/editions/?date=2020-01-01")
    assert res.status_code == 200
    assert res.json()["pages"] == []


@pytest.mark.anyio
async def test_edition_dates(edition_setup):
    client = edition_setup
    res = await client.get("/api/editions/dates")
    assert res.status_code == 200
    dates = res.json()["dates"]
    assert TODAY in dates


@pytest.mark.anyio
async def test_edition_requires_auth(client):
    res = await client.get(f"/api/editions/?date={TODAY}")
    assert res.status_code == 401 or res.status_code == 403


@pytest.mark.anyio
async def test_edition_user_isolation(edition_setup, second_user_client):
    # Second user should see empty edition
    res = await second_user_client.get(f"/api/editions/?date={TODAY}")
    assert res.status_code == 200
    assert len(res.json()["pages"]) == 0
