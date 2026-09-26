"""
Application settings loaded from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./airbnb.db"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    SERVICE_FEE_PCT: float = 0.12
    DEFAULT_PAGE_SIZE: int = 20

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
