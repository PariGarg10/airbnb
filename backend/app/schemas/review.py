from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import Paginated


class ReviewAuthor(BaseModel):
    name: str
    avatar_url: str | None
    created_at: datetime


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=1000)


class ReviewOut(BaseModel):
    id: int
    rating: int
    comment: str
    created_at: datetime
    author: ReviewAuthor


class ReviewPage(Paginated[ReviewOut]):
    rating_distribution: dict[str, int]
