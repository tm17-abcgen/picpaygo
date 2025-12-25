"""OpenRouter API integration"""
import base64
from typing import Any, Optional
import httpx

from config import OPENROUTER_API_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL, JOB_TIMEOUT_SECONDS


def _coerce_image_url(value: Any) -> Optional[str]:
    """Extract image URL from various response formats"""
    if isinstance(value, str) and value:
        return value
    if isinstance(value, dict):
        for key in ("url", "data", "image_url"):
            candidate = value.get(key)
            if isinstance(candidate, str) and candidate:
                return candidate
    return None


async def send_openrouter_request(
    http_client: httpx.AsyncClient,
    prompt: str,
    image_bytes: bytes,
    content_type: str
) -> str:
    """Send request to OpenRouter API"""
    if not OPENROUTER_API_KEY:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        # Fallback for local dev without an API key
        return f"data:{content_type};base64,{encoded}"

    encoded = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{content_type};base64,{encoded}"

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "modalities": ["image", "text"],
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    response = await http_client.post(
        OPENROUTER_API_URL,
        headers=headers,
        json=payload,
        timeout=JOB_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    result = response.json()

    image_url: Optional[str] = None
    message = None
    try:
        message = result["choices"][0]["message"]
    except (KeyError, IndexError, TypeError):
        message = None

    if isinstance(message, dict):
        images = message.get("images")
        if isinstance(images, list) and images:
            image_url = _coerce_image_url(
                images[0].get("image_url") if isinstance(images[0], dict) else images[0]
            )

        if not image_url:
            content = message.get("content")
            if isinstance(content, list):
                for item in content:
                    if not isinstance(item, dict):
                        continue
                    image_url = _coerce_image_url(item.get("image_url") or item.get("image"))
                    if image_url:
                        break

    if not image_url:
        data = result.get("data")
        if isinstance(data, list) and data:
            if isinstance(data[0], dict):
                image_url = _coerce_image_url(data[0].get("url"))
                if not image_url:
                    b64 = data[0].get("b64_json")
                    if isinstance(b64, str) and b64:
                        image_url = f"data:image/png;base64,{b64}"

    if not image_url:
        raise RuntimeError("No image returned from OpenRouter")

    return image_url


