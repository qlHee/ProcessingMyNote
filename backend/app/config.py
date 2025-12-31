"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from pathlib import Path

# 尝试从 api_keys.py 导入 API key
try:
    from app.config.api_keys import DEEPSEEK_API_KEY as _DEEPSEEK_API_KEY
except ImportError:
    _DEEPSEEK_API_KEY = ""


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Processing My Note"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # File Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    ORIGINAL_DIR: Path = UPLOAD_DIR / "original"
    PROCESSED_DIR: Path = UPLOAD_DIR / "processed"
    
    # Image Processing Defaults
    DEFAULT_BLOCK_SIZE: int = 11
    DEFAULT_C: int = 2
    DEFAULT_CONTRAST: float = 1.0
    DEFAULT_BRIGHTNESS: int = 0
    DEFAULT_DENOISE_STRENGTH: int = 10
    
    # DeepSeek API
    DEEPSEEK_API_KEY: str = _DEEPSEEK_API_KEY
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/v1/chat/completions"
    
    class Config:
        env_file = ".env"


settings = Settings()

# Ensure upload directories exist
settings.ORIGINAL_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
