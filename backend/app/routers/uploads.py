from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.core.http import request_base_url
from app.deps import get_current_user
from app.models import User
from app.services.upload_service import save_upload

router = APIRouter(prefix="/api", tags=["uploads"])


@router.post("/uploads")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    _user: User = Depends(get_current_user),
) -> dict[str, str]:
    content = await file.read()
    return {"url": save_upload(content, file.content_type, request_base_url(request))}
