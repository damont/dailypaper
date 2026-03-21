import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from api.config import get_settings
from api.schemas.orm.user import User
from api.schemas.orm.page import Page
from api.schemas.orm.page_content import PageContent
from api.schemas.orm.agent_token import AgentToken
from api.services.storage import LocalStorageBackend, StorageBackend
from api.routes import auth, pages, content, editions, images

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

storage: StorageBackend | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global storage
    settings = get_settings()

    storage = LocalStorageBackend(settings.upload_dir)

    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[User, Page, PageContent, AgentToken],
    )
    logger.info("Connected to MongoDB database: %s", settings.mongodb_db_name)
    yield
    client.close()
    logger.info("Disconnected from MongoDB")

app = FastAPI(
    title="Daily Paper API",
    description="Daily Paper API — personal newspaper app for humans and AI agents",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/agent",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(pages.router, prefix="/api/pages", tags=["pages"])
app.include_router(content.router, prefix="/api/pages", tags=["content"])
app.include_router(editions.router, prefix="/api/editions", tags=["editions"])
app.include_router(images.upload_router, prefix="/api/pages", tags=["images"])
app.include_router(images.serve_router, prefix="/api", tags=["images"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/schema")
async def get_schema():
    return app.openapi()
