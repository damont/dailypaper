import hashlib
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from api.schemas.orm.user import User
from api.schemas.orm.agent_token import AgentToken
from api.schemas.dto.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdateRequest,
    AgentTokenRequest, AgentTokenResponse, AgentTokenInfo, AgentTokenListResponse,
)
from api.utils.auth import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id), email=user.email,
        display_name=user.display_name, newspaper_name=user.newspaper_name,
    )


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest):
    existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=data.email,
        display_name=data.display_name,
        hashed_password=hash_password(data.password),
        newspaper_name=data.newspaper_name,
    )
    await user.insert()
    return user_to_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    user = await User.find_one(User.email == data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return user_to_response(user)


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdateRequest, user=Depends(get_current_user)):
    if data.display_name is not None:
        user.display_name = data.display_name
    if data.newspaper_name is not None:
        user.newspaper_name = data.newspaper_name
    if data.password is not None:
        user.hashed_password = hash_password(data.password)
    user.updated_at = datetime.now(timezone.utc)
    await user.save()
    return user_to_response(user)


@router.post("/agent-token", response_model=AgentTokenResponse)
async def create_agent_token(data: AgentTokenRequest):
    user = await User.find_one(User.email == data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    expires_delta = timedelta(days=data.expires_in_days)
    access_token = create_access_token(str(user.id), expires_delta=expires_delta)

    token_record = AgentToken(
        user_id=str(user.id),
        name=data.name,
        token_hash=hashlib.sha256(access_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + expires_delta,
    )
    await token_record.insert()

    logger.info("Agent token '%s' created for user %s (%d days)", data.name, user.id, data.expires_in_days)
    return AgentTokenResponse(
        access_token=access_token,
        name=data.name,
        expires_in_days=data.expires_in_days,
    )


@router.get("/agent-tokens", response_model=AgentTokenListResponse)
async def list_agent_tokens(user=Depends(get_current_user)):
    tokens = await AgentToken.find(
        AgentToken.user_id == str(user.id),
    ).sort("-created_at").to_list()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    active = [t for t in tokens if t.expires_at.replace(tzinfo=None) > now]
    return AgentTokenListResponse(tokens=[
        AgentTokenInfo(
            id=str(t.id),
            name=t.name,
            created_at=t.created_at.isoformat(),
            expires_at=t.expires_at.isoformat(),
        )
        for t in active
    ])


@router.delete("/agent-tokens/{token_id}", status_code=204)
async def revoke_agent_token(token_id: str, user=Depends(get_current_user)):
    token = await AgentToken.get(token_id)
    if not token or token.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Token not found")
    await token.delete()
    logger.info("Agent token '%s' revoked by user %s", token.name, user.id)
