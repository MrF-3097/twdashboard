"""
Application configuration using Pydantic Settings
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # REBS API Configuration
    REBS_API_BASE_URL: str = "https://towerimob.crmrebs.com/api"
    REBS_API_TOKEN: str = ""
    
    # Database Configuration
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/database.sqlite"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS: bool = False
    
    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dashboard.towerimob.ro"
    ]
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # OpenAI API
    OPENAI_API_KEY: str = ""
    
    # VAPID Keys (Push Notifications)
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_SUBJECT: str = "mailto:admin@towerimob.ro"
    
    # fal.ai API
    FAL_KEY: str = ""
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return not self.DEBUG


# Global settings instance
settings = Settings()



















