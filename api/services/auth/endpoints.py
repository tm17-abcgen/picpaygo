"""Authentication endpoints"""
import asyncio
from typing import Dict
from fastapi import APIRouter, HTTPException, Request, Response

from models import AuthResponse
from config import SESSION_COOKIE, GOOGLE_CLIENT_ID
from services.database.connection import db_pool
from .functions.session import get_session_user, create_session, delete_session, get_session_expiry
from .functions.user import get_user_by_email, create_user, update_user_login, user_exists
from .functions.password import hash_password, generate_salt, encode_salt, decode_salt
from .functions.google_oauth import verify_google_token
from .functions.utils import get_now, get_client_ip

# Legacy in-memory storage (fallback)
users: Dict = {}
sessions: Dict = {}
user_lock = asyncio.Lock()

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/google/config")
async def google_config() -> Dict[str, bool]:
    """Check if Google OAuth is configured"""
    return {"configured": bool(GOOGLE_CLIENT_ID)}


@router.post("/register", response_model=AuthResponse)
async def register(request: Request, response: Response) -> AuthResponse:
    """Register a new user with email and password"""
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    # Check if user exists
    if await user_exists(email):
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create user
    salt = generate_salt()
    password_hash = hash_password(password, salt)
    client_ip = get_client_ip(request)
    
    user_id = await create_user(
        email=email,
        password_hash=password_hash,
        name=payload.get("name"),
        surname=payload.get("surname"),
        is_google_account=False,
        last_login_location=client_ip,
    )

    # Create session
    expires_at = get_session_expiry()
    token = await create_session(str(user_id), expires_at)
    await update_user_login(email, client_ip)

    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        expires=expires_at,
    )
    return AuthResponse(user={"email": email})


@router.post("/login", response_model=AuthResponse)
async def login(request: Request, response: Response) -> AuthResponse:
    """Login with email and password"""
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if this is a Google account
    if user.get("is_google_account") or user.get("isGoogleAccount"):
        raise HTTPException(status_code=400, detail="Please use Google login for this account")
    
    # Verify password
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # For in-memory fallback
    if "salt" in user:
        salt = decode_salt(user["salt"])
        if hash_password(password, salt) != user.get("password_hash"):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    else:
        # Database user - would need to verify password hash
        # For now, we'll need to handle this differently
        raise HTTPException(status_code=401, detail="Password verification not implemented for database users")

    # Create session
    client_ip = get_client_ip(request)
    expires_at = get_session_expiry()
    
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                user_row = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
                if user_row:
                    token = await create_session(str(user_row["id"]), expires_at)
                    await update_user_login(email, client_ip)
                    
                    response.set_cookie(
                        SESSION_COOKIE,
                        token,
                        httponly=True,
                        samesite="lax",
                        secure=False,
                        expires=expires_at,
                    )
                    return AuthResponse(user={"email": email})
        except Exception as e:
            print(f"Database error in login: {e}")

    # Fallback to in-memory
    async with user_lock:
        if email not in users:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user = users[email]
        if user.get("isGoogleAccount"):
            raise HTTPException(status_code=400, detail="Please use Google login for this account")
        salt = decode_salt(user["salt"])
        if hash_password(password, salt) != user["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    token = await create_session(user["userID"], expires_at)
    await update_user_login(email, client_ip)

    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        expires=expires_at,
    )
    return AuthResponse(user={"email": email})


@router.post("/google", response_model=AuthResponse)
async def google_login(request: Request, response: Response) -> AuthResponse:
    """Handle Google OAuth login"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    payload = await request.json()
    id_token_str = payload.get("idToken")
    if not id_token_str:
        raise HTTPException(status_code=400, detail="Google ID token required")

    try:
        # Verify Google token
        google_info = verify_google_token(id_token_str)
        email = google_info["email"]
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google token")
        
        name = google_info["name"]
        surname = google_info["surname"]
        google_id = google_info["google_id"]
        client_ip = get_client_ip(request)
        now = get_now()
        expires_at = get_session_expiry()
        
        if db_pool:
            try:
                async with db_pool.acquire() as conn:
                    async with conn.transaction():
                        # Check if user exists
                        user_row = await conn.fetchrow(
                            "SELECT id FROM users WHERE email = $1", email
                        )
                        
                        if user_row:
                            user_id = user_row["id"]
                            # Update existing user
                            await conn.execute("""
                                UPDATE users 
                                SET name = COALESCE($1, name),
                                    surname = COALESCE($2, surname),
                                    last_login_at = $3,
                                    last_login_location = $4
                                WHERE id = $5
                            """, name or None, surname or None, now, client_ip, user_id)
                        else:
                            # Create new user
                            user_id = await conn.fetchval("""
                                INSERT INTO users (
                                    email, name, surname, password_hash, 
                                    is_google_account, google_id, 
                                    created_at, last_login_at, last_login_location
                                )
                                VALUES ($1, $2, $3, NULL, true, $4, $5, $5, $6)
                                RETURNING id
                            """, email, name or None, surname or None, google_id, now, client_ip)
                            
                            # Initialize credits for new user
                            await conn.execute("""
                                INSERT INTO credits (user_id, balance)
                                VALUES ($1, 0)
                                ON CONFLICT (user_id) DO NOTHING
                            """, user_id)
                        
                        # Create session
                        token = await create_session(str(user_id), expires_at)
                        
                        response.set_cookie(
                            SESSION_COOKIE,
                            token,
                            httponly=True,
                            samesite="lax",
                            secure=False,
                            path="/",
                            expires=expires_at,
                        )
                        return AuthResponse(user={"email": email})
            except Exception as e:
                print(f"Database error in google_login: {e}")
                # Fall through to in-memory fallback
        
        # Fallback to in-memory storage
        async with user_lock:
            if email in users:
                user = users[email]
                user["lastLogin"] = now.isoformat()
                user["lastLoginLocation"] = client_ip
                if name:
                    user["name"] = name
                if surname:
                    user["surname"] = surname
                user_id = user["userID"]
            else:
                user_id = await create_user(
                    email=email,
                    name=name,
                    surname=surname,
                    is_google_account=True,
                    google_id=google_id,
                    last_login_location=client_ip,
                )
        
        token = await create_session(user_id, expires_at)
        
        response.set_cookie(
            SESSION_COOKIE,
            token,
            httponly=True,
            samesite="lax",
            secure=False,
            expires=expires_at,
        )
        return AuthResponse(user={"email": email})
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")


@router.post("/logout")
async def logout(request: Request, response: Response) -> Dict[str, bool]:
    """Logout user by deleting session"""
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        await delete_session(token)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me", response_model=AuthResponse)
async def me(request: Request) -> AuthResponse:
    """Get current user from session"""
    user = await get_session_user(request)
    return AuthResponse(user=user)

