from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "dailypaper"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days
    upload_dir: str = "./uploads"
    smtp_email: Optional[str] = None
    smtp_app_password: Optional[str] = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    password_reset_expire_minutes: int = 60
    frontend_base_url: str = "http://localhost:8098"

    # Google OAuth
    google_client_id: Optional[str] = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
