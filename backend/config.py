"""
Configuration management using Pydantic Settings.

This module loads environment variables into a typed Pydantic model,
providing validation and IDE support.
"""
from pydantic import HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Pydantic-settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Supabase
    SUPABASE_URL: HttpUrl
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Redis
    REDIS_URL: str  # Pydantic doesn't have a RedisDsn type, string is fine

    # Auth
    JWT_SECRET: str

    # n8n
    N8N_API_BASE_URL: HttpUrl

    # CORS Origins
    FRONTEND_URL: str
    PRODUCTION_FRONTEND_URL: str
    
    # Backend URL for webhooks
    BACKEND_URL: str = "http://localhost:8000"
    
    # Webhook security
    WORKFLOW_CALLBACK_SECRET_KEY: str = "change-in-production"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"


# Instantiate the settings object
settings = Settings()
