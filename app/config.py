from pydantic import Field, BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class AppSettings(BaseModel):
    host: str = "localhost"
    port: int = 10808
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = False

class RedisSettings(BaseModel):
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    game_ttl_seconds: int | None = 43200 # 12 hours in seconds

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="_",
        extra="ignore",

        
        )

    app: AppSettings = Field(default_factory=AppSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)

@lru_cache
def get_settings() -> Settings:
    return Settings()

