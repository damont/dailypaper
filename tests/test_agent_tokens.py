import pytest
from datetime import date


@pytest.fixture
async def registered_user(client):
    """Register a user and return the client."""
    await client.post("/api/auth/register", json={
        "email": "agent@example.com",
        "display_name": "Agent User",
        "password": "agentpass123",
        "newspaper_name": "Agent Paper",
    })
    return client


@pytest.mark.anyio
async def test_create_agent_token(registered_user):
    client = registered_user
    res = await client.post("/api/auth/agent-token", json={
        "email": "agent@example.com",
        "password": "agentpass123",
        "name": "my-agent",
        "expires_in_days": 30,
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["name"] == "my-agent"
    assert data["expires_in_days"] == 30


@pytest.mark.anyio
async def test_agent_token_bad_credentials(client):
    res = await client.post("/api/auth/agent-token", json={
        "email": "nobody@example.com",
        "password": "wrong",
        "name": "test",
        "expires_in_days": 30,
    })
    assert res.status_code == 401


@pytest.mark.anyio
async def test_agent_token_works_for_api_calls(registered_user):
    client = registered_user
    token_res = await client.post("/api/auth/agent-token", json={
        "email": "agent@example.com",
        "password": "agentpass123",
        "name": "api-test",
        "expires_in_days": 7,
    })
    token = token_res.json()["access_token"]

    res = await client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    assert res.json()["email"] == "agent@example.com"


@pytest.mark.anyio
async def test_agent_token_works_for_content(registered_user):
    client = registered_user
    token_res = await client.post("/api/auth/agent-token", json={
        "email": "agent@example.com",
        "password": "agentpass123",
        "name": "content-pusher",
        "expires_in_days": 30,
    })
    token = token_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post("/api/pages/", json={
        "name": "News", "slug": "news", "display_order": 0,
    }, headers=headers)
    assert res.status_code == 201

    today = date.today().isoformat()
    res = await client.put(f"/api/pages/news/content?date={today}", json={
        "headline": "Agent Pushed",
        "stories": [{"title": "Auto Story", "body": "Written by agent", "priority": "high", "position": 0}],
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["headline"] == "Agent Pushed"


@pytest.mark.anyio
async def test_list_agent_tokens(registered_user):
    client = registered_user
    for name in ["token-1", "token-2"]:
        await client.post("/api/auth/agent-token", json={
            "email": "agent@example.com",
            "password": "agentpass123",
            "name": name,
            "expires_in_days": 30,
        })

    login_res = await client.post("/api/auth/login", json={
        "email": "agent@example.com",
        "password": "agentpass123",
    })
    token = login_res.json()["access_token"]

    res = await client.get("/api/auth/agent-tokens", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    tokens = res.json()["tokens"]
    assert len(tokens) == 2
    names = [t["name"] for t in tokens]
    assert "token-1" in names
    assert "token-2" in names


@pytest.mark.anyio
async def test_revoke_agent_token(registered_user):
    client = registered_user
    await client.post("/api/auth/agent-token", json={
        "email": "agent@example.com",
        "password": "agentpass123",
        "name": "to-revoke",
        "expires_in_days": 30,
    })

    login_res = await client.post("/api/auth/login", json={
        "email": "agent@example.com",
        "password": "agentpass123",
    })
    auth_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {auth_token}"}

    list_res = await client.get("/api/auth/agent-tokens", headers=headers)
    token_id = list_res.json()["tokens"][0]["id"]

    res = await client.delete(f"/api/auth/agent-tokens/{token_id}", headers=headers)
    assert res.status_code == 204

    list_res = await client.get("/api/auth/agent-tokens", headers=headers)
    assert len(list_res.json()["tokens"]) == 0


@pytest.mark.anyio
async def test_agent_tokens_require_auth(client):
    res = await client.get("/api/auth/agent-tokens")
    assert res.status_code == 401 or res.status_code == 403


@pytest.mark.anyio
async def test_openapi_schema_accessible(client):
    res = await client.get("/api/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    assert schema["info"]["title"] == "Daily Paper API"
    assert "/api/auth/agent-token" in schema["paths"]


@pytest.mark.anyio
async def test_schema_endpoint(client):
    res = await client.get("/api/schema")
    assert res.status_code == 200
    assert "paths" in res.json()
