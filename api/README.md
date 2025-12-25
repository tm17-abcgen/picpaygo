# PicPayGo API Service

FastAPI-based backend service for the PicPayGo application, providing authentication, credits management, and AI image generation capabilities.

## 📁 Project Structure

```
api/
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration and environment variables
├── models.py                  # Pydantic response models
├── requirements.txt           # Python dependencies
├── README.md                  # This file
└── services/                  # Service modules organized by domain
    ├── database/              # Database connection and schema
    │   ├── __init__.py
    │   └── connection.py      # PostgreSQL connection pool and schema initialization
    ├── auth/                  # Authentication service
    │   ├── __init__.py
    │   ├── endpoints.py      # Auth API endpoints (register, login, logout, Google OAuth)
    │   └── functions/         # Auth business logic
    │       ├── __init__.py
    │       ├── user.py       # User CRUD operations
    │       ├── session.py    # Session management (create, validate, delete)
    │       ├── password.py   # Password hashing utilities
    │       ├── google_oauth.py # Google OAuth token verification
    │       └── utils.py       # Auth utility functions (IP extraction, timestamps)
    ├── credits/               # Credits management service
    │   ├── __init__.py
    │   ├── endpoints.py      # Credits API endpoints (get, consume, purchase)
    │   └── functions/         # Credits business logic
    │       ├── __init__.py
    │       ├── credits.py    # User credits operations (get, set, add, deduct)
    │       └── ip_credits.py # IP-based free credits tracking
    └── generate/              # Image generation service
        ├── __init__.py
        ├── endpoints.py      # Generation API endpoints (create job, get status)
        └── functions/         # Generation business logic
            ├── __init__.py
            ├── jobs.py       # Job queue management (create, update, get)
            ├── prompts.py    # Prompt templates for different image styles
            └── openrouter.py # OpenRouter API integration
```

## 📄 File Descriptions

### Core Files

#### `main.py`
- **Purpose**: FastAPI application entry point
- **Contains**:
  - FastAPI app initialization
  - CORS middleware configuration
  - Router registration for all services
  - Startup/shutdown event handlers
  - Health check endpoint (`/api/health`)

#### `config.py`
- **Purpose**: Centralized configuration management
- **Contains**:
  - OpenRouter API settings (URL, key, model)
  - Job processing configuration (workers, timeout)
  - Session configuration (cookie name, TTL)
  - Google OAuth client ID
  - Database connection URL
  - CORS allowed origins
- **Usage**: Import constants directly: `from config import SESSION_COOKIE, GOOGLE_CLIENT_ID`

#### `models.py`
- **Purpose**: Pydantic models for API responses
- **Contains**:
  - `JobCreateResponse` - Response when creating a generation job
  - `JobStatusResponse` - Response for job status queries
  - `CreditsResponse` - Response for credits balance queries
  - `AuthResponse` - Response for authentication endpoints

### Service Modules

#### `services/database/`

##### `connection.py`
- **Purpose**: Database connection and schema management
- **Exports**:
  - `db_pool` - AsyncPG connection pool (global)
  - `init_database()` - Initialize connection and create/update schema
  - `close_database()` - Close connection pool on shutdown
- **Schema Management**:
  - Creates PostgreSQL extension (pgcrypto)
  - Updates users table with Google OAuth fields
  - Creates credits and sessions tables
  - Creates indexes for performance

#### `services/auth/`

##### `endpoints.py`
- **Purpose**: Authentication API endpoints
- **Endpoints**:
  - `POST /api/auth/register` - Register new user with email/password
  - `POST /api/auth/login` - Login with email/password
  - `POST /api/auth/google` - Login/register with Google OAuth
  - `POST /api/auth/logout` - Logout and delete session
  - `GET /api/auth/me` - Get current user from session
  - `GET /api/auth/google/config` - Check Google OAuth configuration

##### `functions/user.py`
- **Purpose**: User management operations
- **Functions**:
  - `get_user_by_email(email)` - Retrieve user by email
  - `create_user(...)` - Create new user (supports both password and Google accounts)
  - `update_user_login(email, location)` - Update last login timestamp and location
  - `user_exists(email)` - Check if user exists

##### `functions/session.py`
- **Purpose**: Session management
- **Functions**:
  - `get_session_user(request)` - Get user from session token (validates expiry)
  - `create_session(user_id, expires_at)` - Create new session and return token
  - `delete_session(token)` - Delete session by token
  - `get_session_expiry()` - Calculate session expiry datetime

##### `functions/password.py`
- **Purpose**: Password hashing utilities
- **Functions**:
  - `hash_password(password, salt)` - Hash password with PBKDF2
  - `generate_salt()` - Generate random salt
  - `encode_salt(salt)` - Encode salt to base64 string
  - `decode_salt(encoded)` - Decode base64 salt to bytes

##### `functions/google_oauth.py`
- **Purpose**: Google OAuth integration
- **Functions**:
  - `verify_google_token(id_token_str)` - Verify Google ID token and extract user info
  - Returns: `{email, name, surname, google_id}`

##### `functions/utils.py`
- **Purpose**: Authentication utility functions
- **Functions**:
  - `get_now()` - Get current UTC datetime
  - `get_client_ip(request)` - Extract client IP from request headers

#### `services/credits/`

##### `endpoints.py`
- **Purpose**: Credits management API endpoints
- **Endpoints**:
  - `GET /api/credits` - Get user credits balance (includes free IP credits)
  - `POST /api/credits/consume` - Consume credits for generation
  - `POST /api/credits/checkout` - Purchase credits pack (5, 10, or 20 credits)

##### `functions/credits.py`
- **Purpose**: User credits operations
- **Functions**:
  - `get_user_credits(email)` - Get user's credit balance
  - `set_user_credits(email, credits)` - Set user's credit balance
  - `add_user_credits(email, amount)` - Add credits to user balance
  - `deduct_user_credits(email, amount)` - Deduct credits from user balance

##### `functions/ip_credits.py`
- **Purpose**: IP-based free credits tracking
- **Functions**:
  - `get_ip_credits(ip)` - Get remaining free credits for IP address
  - `set_ip_credits(ip, remaining)` - Set free credits remaining for IP

#### `services/generate/`

##### `endpoints.py`
- **Purpose**: Image generation API endpoints
- **Endpoints**:
  - `POST /api/generate` - Create new image generation job
  - `GET /api/generate/{job_id}` - Get generation job status
- **Worker Management**:
  - `init_workers(http_client)` - Initialize background workers for job processing
  - `shutdown_workers()` - Shutdown background workers

##### `functions/jobs.py`
- **Purpose**: Job queue management
- **Functions**:
  - `create_job(category)` - Create new generation job
  - `update_job(job_id, **fields)` - Update job fields (status, outputUrl, error)
  - `get_job(job_id)` - Get job by ID

##### `functions/prompts.py`
- **Purpose**: Prompt template management
- **Contains**:
  - `PROMPT_BY_TYPE` - Dictionary mapping categories to prompts
  - `build_prompt(category)` - Get prompt for category (portraits, editorial, documentary)

##### `functions/openrouter.py`
- **Purpose**: OpenRouter API integration
- **Functions**:
  - `send_openrouter_request(http_client, prompt, image_bytes, content_type)` - Send request to OpenRouter and extract image URL from response

## 🔄 Data Flow

### Authentication Flow
1. User submits credentials → `auth/endpoints.py`
2. Endpoint calls → `auth/functions/user.py` (validate/create user)
3. Endpoint calls → `auth/functions/session.py` (create session)
4. Session stored in → PostgreSQL `sessions` table
5. Cookie set in response

### Credits Purchase Flow
1. User purchases credits → `credits/endpoints.py` (checkout endpoint)
2. Endpoint calls → `credits/functions/credits.py` (add_user_credits)
3. Credits updated in → PostgreSQL `credits` table
4. Balance returned to user

### Generation Flow
1. User uploads image → `generate/endpoints.py` (generate endpoint)
2. Endpoint creates job → `generate/functions/jobs.py` (create_job)
3. Job added to queue → Background worker picks up
4. Worker calls → `generate/functions/openrouter.py` (send request)
5. Worker updates job → `generate/functions/jobs.py` (update_job)
6. User polls status → `generate/endpoints.py` (get status endpoint)

## 🗄️ Database Schema

### Tables

#### `users`
- `id` (uuid, primary key)
- `email` (text, unique)
- `password_hash` (text, nullable for Google accounts)
- `name` (text, nullable)
- `surname` (text, nullable)
- `is_google_account` (boolean)
- `google_id` (text, nullable)
- `created_at` (timestamptz)
- `last_login_at` (timestamptz, nullable)
- `last_login_location` (text, nullable)
- `stripe_id` (text, nullable)

#### `credits`
- `user_id` (uuid, primary key, references users.id)
- `balance` (integer, default 0)
- `updated_at` (timestamptz)

#### `sessions`
- `id` (uuid, primary key)
- `user_id` (uuid, references users.id)
- `session_token` (text, unique)
- `expires_at` (timestamptz)
- `created_at` (timestamptz)

## 🔧 Configuration

All configuration is managed through environment variables (see `config.py`):

- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `OPENROUTER_API_KEY` - OpenRouter API key
- `OPENROUTER_MODEL` - Model to use (default: google/gemini-3-pro-image-preview)
- `SESSION_TTL_HOURS` - Session expiration in hours (default: 168 = 7 days)
- `DEFAULT_FREE_CREDITS` - Free credits for new IPs (default: 3)
- `CORS_ORIGINS` - Comma-separated list of allowed origins

## 🚀 Adding New Services

To add a new service (e.g., Stripe payments):

1. **Create service directory**:
   ```
   services/stripe/
   ├── __init__.py
   ├── endpoints.py
   └── functions/
       ├── __init__.py
       └── payments.py
   ```

2. **Create endpoints** in `endpoints.py`:
   ```python
   from fastapi import APIRouter
   router = APIRouter(prefix="/api/stripe", tags=["stripe"])
   
   @router.post("/webhook")
   async def stripe_webhook(request: Request):
       # Handle webhook
       pass
   ```

3. **Create functions** in `functions/payments.py`:
   ```python
   async def process_payment(amount: int, user_id: str):
       # Payment logic
       pass
   ```

4. **Register router** in `main.py`:
   ```python
   from .services.stripe.endpoints import router as stripe_router
   app.include_router(stripe_router)
   ```

## 📝 Code Patterns

### Database Operations
- Always check `db_pool` before database operations
- Fallback to in-memory storage if database unavailable
- Use transactions for multi-step operations
- Handle exceptions gracefully with fallback

### Session Management
- Sessions stored in PostgreSQL with expiry validation
- HTTP-only cookies for security
- Automatic cleanup of expired sessions

### Error Handling
- Use FastAPI's `HTTPException` for API errors
- Log database errors but continue with fallback
- Return appropriate status codes (400, 401, 404, 500)

## 🔐 Security Considerations

- Passwords: Hashed with PBKDF2 (100,000 iterations)
- Sessions: HTTP-only cookies, expires after configured TTL
- Google OAuth: Token verified with Google's servers
- Database: Parameterized queries to prevent SQL injection
- CORS: Configured for specific origins only

## 🧪 Testing

To test the API locally:

1. **Set environment variables**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/picpaygo"
   export GOOGLE_CLIENT_ID="your-client-id"
   export OPENROUTER_API_KEY="your-api-key"
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server**:
   ```bash
   uvicorn main:app --reload --port 8081
   ```

## 📚 Dependencies

See `requirements.txt` for full list:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `asyncpg` - PostgreSQL async driver
- `httpx` - HTTP client for OpenRouter
- `google-auth` - Google OAuth verification
- `pydantic` - Data validation

## 🔄 Migration Notes

The codebase supports both database and in-memory storage:
- **Database**: Primary storage (PostgreSQL)
- **In-memory**: Fallback for development/testing
- All functions check `db_pool` first, then fallback to in-memory dicts

This allows the service to work even if the database is temporarily unavailable, though data won't persist across restarts without the database.


