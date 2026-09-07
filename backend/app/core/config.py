from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/flota"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 600
    cors_origins: list[str] = ["http://localhost:3000"]
    proximo_a_vencer_dias: int = 5


settings = Settings()
