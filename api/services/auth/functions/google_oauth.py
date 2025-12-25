"""Google OAuth functions"""
from typing import Dict, Any
from google.auth.transport import requests
from google.oauth2 import id_token

from config import GOOGLE_CLIENT_ID


def verify_google_token(id_token_str: str) -> Dict[str, Any]:
    """Verify Google ID token and return user info"""
    if not GOOGLE_CLIENT_ID:
        raise ValueError("Google OAuth not configured")
    
    idinfo = id_token.verify_oauth2_token(
        id_token_str, requests.Request(), GOOGLE_CLIENT_ID
    )
    
    return {
        "email": (idinfo.get("email") or "").lower().strip(),
        "name": idinfo.get("given_name", ""),
        "surname": idinfo.get("family_name", ""),
        "google_id": idinfo.get("sub", ""),
    }


