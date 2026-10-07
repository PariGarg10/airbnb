from pydantic import BaseModel, Field, field_validator


def _clean_name(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Name is required")
    if len(cleaned) > 50:
        raise ValueError("Name must be at most 50 characters")
    return cleaned


class WishlistWrite(BaseModel):
    name: str = Field(min_length=1, max_length=50)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return _clean_name(value)


class WishlistCreate(WishlistWrite):
    listing_id: int | None = None


class WishlistSummary(BaseModel):
    id: int
    name: str
    count: int
    cover_images: list[str]
    listing_ids: list[int]


class SavedIds(BaseModel):
    listing_ids: list[int]
