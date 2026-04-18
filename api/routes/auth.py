import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from api.config import get_settings
from api.schemas.orm.user import User
from api.schemas.orm.agent_token import AgentToken
from api.schemas.orm.password_reset import PasswordResetToken
from api.schemas.dto.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdateRequest,
    PasswordResetRequest, PasswordResetConfirm, MessageResponse,
    AgentTokenRequest, AgentTokenResponse, AgentTokenInfo, AgentTokenListResponse,
    GoogleLoginRequest,
)
from api.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from api.services.email import send_password_reset_email

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
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/google", response_model=TokenResponse)
async def google_login(data: GoogleLoginRequest):
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(
            status_code=500,
            detail="Google login not configured",
        )

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Google auth library not installed",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            data.id_token, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    sub = idinfo.get("sub")
    email = idinfo.get("email")
    email_verified = idinfo.get("email_verified", False)
    name = idinfo.get("name") or (email.split("@")[0] if email else None)

    if not sub or not email or not email_verified:
        raise HTTPException(
            status_code=401,
            detail="Google token missing required claims",
        )

    user = await User.find_one(User.google_sub == sub)

    if not user:
        # Link Google to existing email/password user if email matches.
        user = await User.find_one(User.email == email)
        if user:
            user.google_sub = sub
            user.email_verified = True
            await user.save()
        else:
            user = User(
                email=email,
                display_name=name,
                hashed_password=None,
                newspaper_name=f"{name}'s Paper",
                google_sub=sub,
                email_verified=True,
            )
            await user.insert()

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


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: PasswordResetRequest):
    settings = get_settings()
    message = "If that email is registered, a reset link has been sent."

    user = await User.find_one(User.email == data.email)
    if not user:
        return MessageResponse(message=message)

    user_id = str(user.id)
    existing = await PasswordResetToken.find(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.used_at == None,  # noqa: E711
    ).to_list()
    for t in existing:
        t.used_at = datetime.now(timezone.utc)
        await t.save()

    token = secrets.token_urlsafe(16)
    reset_token = PasswordResetToken(
        token=token,
        user_id=user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes),
    )
    await reset_token.insert()

    reset_url = f"{settings.frontend_base_url}/reset-password/{token}"
    try:
        await send_password_reset_email(data.email, reset_url)
    except Exception:
        logger.exception("Failed to send password reset email to %s", data.email)

    return MessageResponse(message=message)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: PasswordResetConfirm):
    reset_token = await PasswordResetToken.find_one(PasswordResetToken.token == data.token)

    if not reset_token or reset_token.used_at or reset_token.expires_at.replace(tzinfo=None) < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user = await User.get(reset_token.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    reset_token.used_at = datetime.now(timezone.utc)
    await reset_token.save()

    user.hashed_password = hash_password(data.new_password)
    await user.save()

    return MessageResponse(message="Password has been reset. You can now sign in.")


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
