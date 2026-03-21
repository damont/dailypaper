import pytest


@pytest.mark.anyio
async def test_health_check(client):
    res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_register(client):
    res = await client.post("/api/auth/register", json={
        "email": "new@example.com",
        "display_name": "New User",
        "password": "password123",
        "newspaper_name": "The New Gazette",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new@example.com"
    assert data["display_name"] == "New User"
    assert data["newspaper_name"] == "The New Gazette"
    assert "id" in data


@pytest.mark.anyio
async def test_register_duplicate_email(client):
    await client.post("/api/auth/register", json={
        "email": "same@example.com",
        "display_name": "User 1",
        "password": "password123",
        "newspaper_name": "Paper 1",
    })
    res = await client.post("/api/auth/register", json={
        "email": "same@example.com",
        "display_name": "User 2",
        "password": "password123",
        "newspaper_name": "Paper 2",
    })
    assert res.status_code == 409


@pytest.mark.anyio
async def test_login(client):
    await client.post("/api/auth/register", json={
        "email": "login@example.com",
        "display_name": "Login User",
        "password": "password123",
        "newspaper_name": "Login Paper",
    })
    res = await client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "password123",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.anyio
async def test_login_bad_password(client):
    await client.post("/api/auth/register", json={
        "email": "bad@example.com",
        "display_name": "Bad User",
        "password": "password123",
        "newspaper_name": "Bad Paper",
    })
    res = await client.post("/api/auth/login", json={
        "email": "bad@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


@pytest.mark.anyio
async def test_login_nonexistent_user(client):
    res = await client.post("/api/auth/login", json={
        "email": "noone@example.com",
        "password": "password123",
    })
    assert res.status_code == 401


@pytest.mark.anyio
async def test_me(authenticated_client):
    res = await authenticated_client.get("/api/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test@example.com"
    assert data["display_name"] == "Test User"
    assert data["newspaper_name"] == "The Test Times"


@pytest.mark.anyio
async def test_me_unauthenticated(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401 or res.status_code == 403


@pytest.mark.anyio
async def test_update_profile(authenticated_client):
    res = await authenticated_client.put("/api/auth/me", json={
        "display_name": "Updated User",
        "newspaper_name": "The Updated Times",
    })
    assert res.status_code == 200
    assert res.json()["display_name"] == "Updated User"
    assert res.json()["newspaper_name"] == "The Updated Times"

    # Verify it persisted
    res = await authenticated_client.get("/api/auth/me")
    assert res.json()["display_name"] == "Updated User"
    assert res.json()["newspaper_name"] == "The Updated Times"
