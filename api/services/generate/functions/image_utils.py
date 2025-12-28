"""Image conversion utilities."""

import io

import pillow_heif

pillow_heif.register_heif_opener()

from PIL import Image

HEIC_MIME_TYPES = {"image/heic", "image/heif"}


def is_heic(content_type: str | None, filename: str | None) -> bool:
    """Check if image is HEIC by MIME type or extension."""
    if content_type and content_type.lower() in HEIC_MIME_TYPES:
        return True
    if filename and filename.lower().endswith((".heic", ".heif")):
        return True
    return False


def convert_heic_to_jpeg(image_bytes: bytes, quality: int = 90) -> tuple[bytes, str]:
    """Convert HEIC to JPEG. Returns (jpeg_bytes, content_type)."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=quality)
        return output.getvalue(), "image/jpeg"
