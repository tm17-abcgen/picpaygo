# API Endpoints

Base URL: `/api`  
Auth: session cookie (HttpOnly, SameSite=Lax)

## Health
### GET /health
Simple health check for the API container.
```
Response: { "ok": true }
```

## Auth
### POST /auth/register
Create an account and trigger email verification.
```
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "email": "user@example.com", "verificationRequired": "true" } }
```

### POST /auth/login
Create a session cookie.
```
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "email": "user@example.com" } }
Errors: 401 invalid credentials
```

### GET /auth/verify?token=...
Verify email confirmation token.
```
Response: { "ok": true, "verified": true }
```

### POST /auth/logout
Revoke session.
```
Request: {}
Response: { "ok": true }
```

### GET /auth/me
Return current user.
```
Response: { "user": { "email": "..." } }
```

## Guest History
### POST /history/clear
Clear all generations owned by the current guest session and rotate the guest cookie.
```
Response: { "cleared": true }
```

## Credits
### GET /credits
Return credit balance (free + paid).
```
Response: { "balance": 2, "freeCredits": 1, "userCredits": 1, "isLoggedIn": true }
```

### POST /credits/consume
Consume credits (free credits are used first).
```
Request: { "amount": 1 }
Response: { "balance": 1, "freeCredits": 0, "userCredits": 1 }
```

### POST /credits/checkout
Add credits to the logged-in user (stub checkout).
```
Request: { "packSize": 5 }  // or 10/20
Response: { "ok": true, "added": 5 }
```

## Generations
### POST /generate
Create a generation job. Requires an image upload and a `type` field (style key).
```
Request (multipart/form-data):
- `type`: one of `studio-portrait`, `fashion-editorial`, `editorial-moment`, `portrait-honest`
- `image`: uploaded file

Response: { "jobId": "..." }
```

### GET /generate/:jobId
Get the status of a generation job.
```
Response: {
  "id": "...",
  "status": "queued|processing|completed|failed",
  "category": "...",
  "createdAt": "...",
  "inputUrl": "...",
  "outputUrl": "...",
  "error": "..."?
}
```

### GET /generations
List recent generations for the current user/guest.
Query params:
- `scope`: `auto` (default), `user`, `guest`, `all`
- `limit`: max 100
- `cursor`: ISO timestamp cursor
```
Response: { "generations": [...], "cursor": "..."? }
```

## Images
### GET /images/:bucket/:key
Proxy images from MinIO, with an ownership check (user session or guest session).
