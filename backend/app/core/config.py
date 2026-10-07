from decimal import Decimal
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATA_DIR: str = "."
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = ""
    SERVICE_FEE_RATE: Decimal = Decimal("0.14")
    TAX_RATE: Decimal = Decimal("0.05")

    @property
    def DATABASE_URL(self) -> str:
        path = (Path(self.DATA_DIR) / "airbnb.db").as_posix()
        return f"sqlite:///{path}"

    @property
    def database_url(self) -> str:
        return self.DATABASE_URL

    @property
    def UPLOAD_DIR(self) -> Path:
        return Path(self.DATA_DIR) / "uploads"

    @property
    def upload_dir(self) -> Path:
        return self.UPLOAD_DIR

    @property
    def cors_origins(self) -> list[str]:
        origins: list[str] = []
        for raw in (self.FRONTEND_URL, self.ALLOWED_ORIGINS):
            for part in raw.split(","):
                origin = part.strip().rstrip("/")
                if origin and origin not in origins:
                    origins.append(origin)
        return origins


settings = Settings()


def ensure_directories() -> None:
    Path(settings.DATA_DIR).mkdir(parents=True, exist_ok=True)
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
