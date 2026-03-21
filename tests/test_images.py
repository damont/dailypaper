import pytest
from io import BytesIO

from api.services.storage import LocalStorageBackend
import api.main


@pytest.fixture(autouse=True)
async def setup_storage(tmp_path):
    """Use a temporary directory for image storage during tests."""
    api.main.storage = LocalStorageBackend(str(tmp_path / "uploads"))
    yield


@pytest.fixture
async def image_setup(authenticated_client):
    await authenticated_client.post("/api/pages/", json={
        "name": "News", "slug": "news", "display_order": 0,
    })
    return authenticated_client


@pytest.mark.anyio
async def test_upload_image(image_setup):
    client = image_setup
    res = await client.post(
        "/api/pages/news/images",
        files={"file": ("test.jpg", b"fake-image-data", "image/jpeg")},
    )
    assert res.status_code == 201
    data = res.json()
    assert "image_key" in data
    assert data["image_key"].endswith(".jpg")


@pytest.mark.anyio
async def test_serve_image(image_setup):
    client = image_setup
    upload_res = await client.post(
        "/api/pages/news/images",
        files={"file": ("photo.png", b"png-data", "image/png")},
    )
    key = upload_res.json()["image_key"]

    res = await client.get(f"/api/images/{key}")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert res.content == b"png-data"


@pytest.mark.anyio
async def test_serve_nonexistent_image(client):
    res = await client.get("/api/images/nonexistent/path.jpg")
    assert res.status_code == 404


@pytest.mark.anyio
async def test_reject_bad_file_type(image_setup):
    client = image_setup
    res = await client.post(
        "/api/pages/news/images",
        files={"file": ("script.exe", b"bad-data", "application/octet-stream")},
    )
    assert res.status_code == 400


@pytest.mark.anyio
async def test_upload_requires_auth(client):
    await client.post("/api/pages/", json={"name": "News", "slug": "news", "display_order": 0})
    res = await client.post(
        "/api/pages/news/images",
        files={"file": ("test.jpg", b"data", "image/jpeg")},
    )
    assert res.status_code == 401 or res.status_code == 403
