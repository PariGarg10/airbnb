from decimal import Decimal
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_ORIGINS = ["http://localhost:3000"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATA_DIR: str = "."
    FRONTEND_URL: str = ""
    SERVICE_FEE_RATE: Decimal = Decimal("0.14")
    TAX_RATE: Decimal = Decimal("0.05")

    @property
    def database_url(self) -> str:
        path = (Path(self.DATA_DIR) / "airbnb.db").as_posix()
        return f"sqlite:///{path}"

    @property
    def upload_dir(self) -> Path:
        return Path(self.DATA_DIR) / "uploads"

    @property
    def cors_origins(self) -> list[str]:
        origins = list(LOCAL_ORIGINS)
        for part in self.FRONTEND_URL.split(","):
            origin = part.strip().rstrip("/")
            if origin and origin not in origins:
                origins.append(origin)
        return origins


settings = Settings()
