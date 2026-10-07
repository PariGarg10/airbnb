import uuid
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import BadRequestError

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def save_upload(content: bytes, content_type: str | None, base_url: str) -> str:
    if len(content) > MAX_UPLOAD_BYTES:
        raise BadRequestError("File is larger than 5MB")
    extension = _extension_for(content, content_type)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}.{extension}"
    path = Path(settings.upload_dir) / filename
    path.write_bytes(content)
    root = base_url.rstrip("/")
    return f"{root}/static/uploads/{filename}"


def _extension_for(content: bytes, content_type: str | None) -> str:
    media_type = (content_type or "").split(";", 1)[0].strip().lower()
    extension = _CONTENT_TYPES.get(media_type)
    if extension is None or not _matches(content, extension):
        raise BadRequestError("Only jpeg, png, and webp images are allowed")
    return extension


def _matches(content: bytes, extension: str) -> bool:
    if extension == "jpg":
        return content.startswith(b"\xff\xd8\xff")
    if extension == "png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    return len(content) >= 12 and content.startswith(b"RIFF") and content[8:12] == b"WEBP"
