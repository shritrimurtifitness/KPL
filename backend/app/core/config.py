from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import os
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cricket League Registration System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Host
    ENV: str = "development"
    DEBUG: bool = True
    TIMEZONE: str = "Asia/Kolkata"
    PORT: int = 8000
    
    # Secret Key for JWT & Security
    SECRET_KEY: str = "cricket-super-secret-production-key-change-in-env-2027"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"
    
    # Database
    DATABASE_URL: str = "sqlite:///./cricket_league.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Supabase Storage Integration (Private bucket)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "payment-proofs"
    
    # Local Storage fallback directory
    LOCAL_STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage_uploads")
    
    # Initial Admin Seed
    INITIAL_ADMIN_EMAIL: str = "admin@cricketleague.com"
    INITIAL_ADMIN_PASSWORD: str = "CricketAdmin@2027"
    INITIAL_ADMIN_NAME: str = "League Administrator"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
