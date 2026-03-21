from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class AgentToken(Document):
    user_id: Indexed(str)
    name: str
    token_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime

    class Settings:
        name = "agent_tokens"
