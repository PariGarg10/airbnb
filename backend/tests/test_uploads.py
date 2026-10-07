from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings
from tests.helpers import add_user

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


def _auth(user_id: int) -> dict[str, str]:
    return {"X-User-Id": str(user_id)}


def test_upload_rejects_wrong_type_and_size(api):
    client, db = api
    user = add_user(db, "guest@example.com")
    db.commit()
    headers = _auth(user.id)

    wrong_type = client.post(
        "/api/uploads",
        headers=headers,
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )
    assert wrong_type.status_code == 400

    oversized = b"\xff\xd8\xff" + b"0" * (5 * 1024 * 1024)
    too_big = client.post(
        "/api/uploads",
        headers=headers,
        files={"file": ("huge.jpg", oversized, "image/jpeg")},
    )
    assert too_big.status_code == 400

    saved = client.post(
        "/api/uploads",
        headers=headers,
        files={"file": ("photo.png", PNG, "image/png")},
    )
    assert saved.status_code == 200
    url = saved.json()["url"]
    path = urlparse(url).path
    assert path.startswith("/static/uploads/")
    assert path.endswith(".png")
    fetched = client.get(path)
    assert fetched.status_code == 200
    assert fetched.content == PNG
    Path(settings.upload_dir, Path(path).name).unlink()
