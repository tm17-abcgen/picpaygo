"""Password hashing functions"""
import base64
import hashlib
import secrets


def hash_password(password: str, salt: bytes) -> str:
    """Hash a password with PBKDF2"""
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return hashed.hex()


def generate_salt() -> bytes:
    """Generate a random salt"""
    return secrets.token_bytes(16)


def encode_salt(salt: bytes) -> str:
    """Encode salt to base64 string"""
    return base64.b64encode(salt).decode("ascii")


def decode_salt(encoded: str) -> bytes:
    """Decode base64 salt string to bytes"""
    return base64.b64decode(encoded)


