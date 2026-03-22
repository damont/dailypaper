from typing import Optional
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    email: str
    display_name: str
    password: str
    newspaper_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    newspaper_name: str


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    newspaper_name: Optional[str] = None
    password: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class MessageResponse(BaseModel):
    message: str


class AgentTokenRequest(BaseModel):
    email: str
    password: str
    name: str = "default"
    expires_in_days: int = Field(default=30, ge=1, le=365)


class AgentTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    name: str
    expires_in_days: int


class AgentTokenInfo(BaseModel):
    id: str
    name: str
    created_at: str
    expires_at: str


class AgentTokenListResponse(BaseModel):
    tokens: list[AgentTokenInfo]
