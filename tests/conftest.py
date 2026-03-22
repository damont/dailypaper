import os
import pytest
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from api.main import app
from api.schemas.orm.user import User
from api.schemas.orm.page import Page
from api.schemas.orm.page_content import PageContent
from api.schemas.orm.agent_token import AgentToken
from api.schemas.orm.password_reset import PasswordResetToken
from api.utils.auth import hash_password, create_access_token

TEST_DB_NAME = "dailypaper_test"
MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
async def setup_test_db():
    client = AsyncIOMotorClient(MONGODB_URL)
    await init_beanie(
        database=client[TEST_DB_NAME],
        document_models=[User, Page, PageContent, AgentToken, PasswordResetToken],
    )
    yield
    await client.drop_database(TEST_DB_NAME)
    client.close()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def authenticated_client(client: AsyncClient):
    user = User(
        email="test@example.com",
        display_name="Test User",
        hashed_password=hash_password("testpass123"),
        newspaper_name="The Test Times",
    )
    await user.insert()
    token = create_access_token(str(user.id))
    client.headers["Authorization"] = f"Bearer {token}"
    yield client


@pytest.fixture
async def second_user_client(client: AsyncClient):
    """A second authenticated client for testing user isolation."""
    user = User(
        email="other@example.com",
        display_name="Other User",
        hashed_password=hash_password("otherpass123"),
        newspaper_name="The Other Paper",
    )
    await user.insert()
    token = create_access_token(str(user.id))
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        c.headers["Authorization"] = f"Bearer {token}"
        yield c
