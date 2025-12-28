# PicPayGo

Portrait photographer portfolio with AI-powered image generation. Upload a photo, pick a style, get an AI-enhanced result.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4
- **Backend**: FastAPI, Python 3.11, PostgreSQL 16, MinIO
- **AI**: OpenRouter API (Gemini)
- **Payments**: Stripe

## Quick Start

```bash
# Copy environment files
cp .env.example .env
cp api/.env.example api/.env

# Add your API keys to api/.env (OPENROUTER_API_KEY, STRIPE_SECRET_KEY)

# Start everything
docker compose up --build

# Open http://localhost:8080
```

### Development Mode

```bash
# Terminal 1 - Backend
cd api && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8081

# Terminal 2 - Frontend
npm install
VITE_API_PROXY_TARGET=http://127.0.0.1:8081 npm run dev
```

## Project Structure

```
src/                    # React frontend
├── pages/              # Home, Generate, Account, SeriesPage, Contact
├── components/         # UI components (gallery, layout, generate)
├── context/            # CreditsContext, PortfolioContext
├── hooks/              # useGallery, useAutoAdvance
└── services/api.ts     # API client

api/                    # FastAPI backend
├── main.py             # App entry point
├── config.py           # Environment config
└── services/           # auth, credits, generate, storage, email, contact
```

## Environment Variables

**api/.env** (required):
```bash
OPENROUTER_API_KEY=sk-or-v1-...      # AI generation
STRIPE_SECRET_KEY=sk_test_...         # Payments
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:8080

# Email (for verification & contact form)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USE_SSL=false
EMAIL_ACCOUNT=noreply@example.com
EMAIL_PW=...
EMAIL_FROM_NAME=PicPayGo
SUPPORT_EMAIL=support@example.com
```

See `.env.example` and `api/.env.example` for full list.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account (sends verification email) |
| `GET /api/auth/verify` | Verify email with token |
| `POST /api/auth/login` | Login |
| `GET /api/credits` | Get credit balance |
| `POST /api/generate` | Create generation (multipart: type + image) |
| `GET /api/generate/:id` | Get job status |
| `GET /api/generations` | List generations |
| `POST /api/contact` | Submit contact form |

## Database

Auto-initialized from `docs/db/schema.sql` on startup.

Key tables: `users`, `credits`, `generations`, `generation_assets`, `guest_sessions`, `payments`

## Scripts

```bash
npm run dev              # Frontend dev server
npm run build            # Production build
docker compose up        # Full stack
docker compose logs api  # View API logs
```
