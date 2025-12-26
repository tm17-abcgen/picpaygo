"""
MinIO storage module for handling image uploads and image serving.

Architecture:
- Internal client (MINIO_ENDPOINT=minio:9000): Used for all server-side operations
  including uploads, downloads, and bucket management.
- Image proxy: Browsers access images via /api/images/{bucket}/{key} endpoint,
  which fetches from MinIO and streams to the client. This avoids presigned URL
  signature issues and requires no special DNS configuration.
"""

from __future__ import annotations

import io
from typing import Optional
from urllib.parse import quote

import urllib3
from minio import Minio
from minio.error import S3Error

import config

# Suppress SSL warnings for local development
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Bucket names
BUCKET_RAW = config.BUCKET_RAW
BUCKET_GENERATED = config.BUCKET_GENERATED

# Global MinIO client
_client: Optional[Minio] = None


def get_client() -> Minio:
    """Get or create the MinIO client."""
    global _client
    if _client is None:
        _client = Minio(
            config.MINIO_ENDPOINT,
            access_key=config.MINIO_ACCESS_KEY,
            secret_key=config.MINIO_SECRET_KEY,
            secure=config.MINIO_USE_HTTPS,
        )
    return _client


async def init_buckets() -> None:
    """Ensure required buckets exist."""
    client = get_client()
    for bucket in [BUCKET_RAW, BUCKET_GENERATED]:
        try:
            if not client.bucket_exists(bucket):
                client.make_bucket(bucket)
                print(f"Created bucket: {bucket}")
        except S3Error as exc:
            print(f"Error checking/creating bucket {bucket}: {exc}")


def get_input_key(generation_id: str, filename: str = "input.jpg") -> str:
    """Get the object key for an input image."""
    return f"raw/{generation_id}/{filename}"


def get_output_key(generation_id: str, filename: str = "output.png") -> str:
    """Get the object key for an output image."""
    return f"generated/{generation_id}/{filename}"


def upload_input(generation_id: str, data: bytes, content_type: str, filename: str = "input.jpg") -> str:
    """
    Upload an input image to MinIO.
    Returns the object key.
    """
    client = get_client()
    key = get_input_key(generation_id, filename)
    client.put_object(
        BUCKET_RAW,
        key,
        data=io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return key


def upload_output(generation_id: str, data: bytes, content_type: str = "image/png", filename: str = "output.png") -> str:
    """
    Upload an output image to MinIO.
    Returns the object key.
    """
    client = get_client()
    key = get_output_key(generation_id, filename)
    client.put_object(
        BUCKET_GENERATED,
        key,
        data=io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return key


def get_object_bytes(bucket: str, key: str) -> bytes:
    """
    Directly retrieve object bytes from MinIO.
    Use this for server-side access (e.g., workers processing images).
    """
    client = get_client()
    response = client.get_object(bucket, key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def get_object_with_content_type(bucket: str, key: str) -> tuple[bytes, Optional[str]]:
    """
    Retrieve object bytes and content-type from MinIO.
    Returns (bytes, content_type) tuple.
    """
    client = get_client()
    response = client.get_object(bucket, key)
    try:
        data = response.read()
        content_type = response.headers.get("Content-Type", "image/jpeg")
        return data, content_type
    finally:
        response.close()
        response.release_conn()


def get_proxy_url(bucket: str, key: str) -> str:
    """
    Generate a proxy URL for accessing an object through the API.
    The API will fetch from MinIO and stream to the client.
    """
    encoded_key = quote(key, safe="")
    return f"{config.API_PREFIX}/images/{bucket}/{encoded_key}"


def get_input_proxy_url(generation_id: str, filename: str = "input.jpg") -> str:
    """Get a proxy URL for an input image."""
    return get_proxy_url(BUCKET_RAW, get_input_key(generation_id, filename))


def get_output_proxy_url(generation_id: str, filename: str = "output.png") -> str:
    """Get a proxy URL for an output image."""
    return get_proxy_url(BUCKET_GENERATED, get_output_key(generation_id, filename))


def delete_generation_files(generation_id: str) -> None:
    """
    Delete all files associated with a generation.
    This is useful for cleanup or when a generation is deleted.
    """
    client = get_client()

    try:
        objects = client.list_objects(BUCKET_RAW, prefix=f"raw/{generation_id}/")
        for obj in objects:
            client.remove_object(BUCKET_RAW, obj.object_name)
    except S3Error:
        pass

    try:
        objects = client.list_objects(BUCKET_GENERATED, prefix=f"generated/{generation_id}/")
        for obj in objects:
            client.remove_object(BUCKET_GENERATED, obj.object_name)
    except S3Error:
        pass

