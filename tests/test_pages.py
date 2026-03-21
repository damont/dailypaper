import pytest


@pytest.mark.anyio
async def test_create_page(authenticated_client):
    res = await authenticated_client.post("/api/pages/", json={
        "name": "News",
        "slug": "news",
        "display_order": 0,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "News"
    assert data["slug"] == "news"
    assert "id" in data


@pytest.mark.anyio
async def test_create_duplicate_slug(authenticated_client):
    await authenticated_client.post("/api/pages/", json={
        "name": "News",
        "slug": "news",
        "display_order": 0,
    })
    res = await authenticated_client.post("/api/pages/", json={
        "name": "News 2",
        "slug": "news",
        "display_order": 1,
    })
    assert res.status_code == 409


@pytest.mark.anyio
async def test_list_pages(authenticated_client):
    await authenticated_client.post("/api/pages/", json={"name": "News", "slug": "news", "display_order": 1})
    await authenticated_client.post("/api/pages/", json={"name": "Sports", "slug": "sports", "display_order": 0})

    res = await authenticated_client.get("/api/pages/")
    assert res.status_code == 200
    pages = res.json()
    assert len(pages) == 2
    # Should be sorted by display_order
    assert pages[0]["slug"] == "sports"
    assert pages[1]["slug"] == "news"


@pytest.mark.anyio
async def test_update_page(authenticated_client):
    await authenticated_client.post("/api/pages/", json={"name": "News", "slug": "news", "display_order": 0})

    res = await authenticated_client.put("/api/pages/news", json={"name": "World News"})
    assert res.status_code == 200
    assert res.json()["name"] == "World News"


@pytest.mark.anyio
async def test_update_nonexistent_page(authenticated_client):
    res = await authenticated_client.put("/api/pages/nope", json={"name": "X"})
    assert res.status_code == 404


@pytest.mark.anyio
async def test_delete_page(authenticated_client):
    await authenticated_client.post("/api/pages/", json={"name": "News", "slug": "news", "display_order": 0})

    res = await authenticated_client.delete("/api/pages/news")
    assert res.status_code == 204

    res = await authenticated_client.get("/api/pages/")
    assert len(res.json()) == 0


@pytest.mark.anyio
async def test_delete_nonexistent_page(authenticated_client):
    res = await authenticated_client.delete("/api/pages/nope")
    assert res.status_code == 404


@pytest.mark.anyio
async def test_pages_require_auth(client):
    res = await client.get("/api/pages/")
    assert res.status_code == 401 or res.status_code == 403


@pytest.mark.anyio
async def test_user_isolation_pages(authenticated_client, second_user_client):
    await authenticated_client.post("/api/pages/", json={"name": "Private", "slug": "private", "display_order": 0})

    res = await second_user_client.get("/api/pages/")
    assert res.status_code == 200
    assert len(res.json()) == 0
