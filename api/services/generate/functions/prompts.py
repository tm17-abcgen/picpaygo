"""Prompt generation functions"""
from typing import Dict
from fastapi import HTTPException

PROMPT_BY_TYPE: Dict[str, str] = {
    "portraits": (
        "Use the uploaded photo as the reference. Generate a clean, professional portrait with soft "
        "studio lighting, natural skin texture, and a neutral background. Keep the subject's identity "
        "and facial features consistent."
    ),
    "editorial": (
        "Use the uploaded photo as the reference. Generate a high-end editorial portrait with fashion "
        "lighting, subtle styling, and a magazine-ready finish. Keep the subject's identity consistent."
    ),
    "documentary": (
        "Use the uploaded photo as the reference. Generate a candid, documentary-style portrait with "
        "natural light, authentic texture, and minimal retouching. Keep the subject's identity consistent."
    ),
}


def build_prompt(category: str) -> str:
    """Build prompt for given category"""
    prompt = PROMPT_BY_TYPE.get(category)
    if not prompt:
        raise HTTPException(status_code=400, detail="Unsupported type")
    return prompt


