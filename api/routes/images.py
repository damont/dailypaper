import logging
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from api.schemas.dto.content import ImageUploadResponse
from api.utils.auth import get_current_user

logger = logging.getLogger(__name__)
upload_router = APIRouter()
serve_router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


@upload_router.post("/{slug}/images", response_model=ImageUploadResponse, status_code=201)
async def upload_image(
    slug: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    from api.main import storage

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

    data = await file.read()
    file_id = str(uuid.uuid4())
    key = f"{user.id}/{slug}/{file_id}{ext}"
    content_type = CONTENT_TYPES.get(ext)
    await storage.save(key, data, content_type=content_type)

    logger.info("Image uploaded: %s by user %s", key, user.id)
    return ImageUploadResponse(image_key=key)


@serve_router.get("/images/{key:path}")
async def serve_image(key: str):
    from api.main import storage

    data = await storage.load(key)
    if data is None:
        raise HTTPException(status_code=404, detail="Image not found")

    ext = Path(key).suffix.lower()
    content_type = CONTENT_TYPES.get(ext, "application/octet-stream")
    return Response(content=data, media_type=content_type)
