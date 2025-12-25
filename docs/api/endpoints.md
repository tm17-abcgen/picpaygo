# API Endpoints

Base URL: `/api`  
Auth: session cookie (HttpOnly, SameSite=Lax)

## Auth
### POST /auth/register
Create an account and trigger email verification.
```
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "id": "...", "email": "user@example.com" }, "verificationRequired": true }
```

### POST /auth/login
Create a session cookie (requires verified email).
```
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "id": "...", "email": "user@example.com" } }
Errors: 401 invalid credentials, 403 email not verified
```

### GET /auth/verify?token=...
Verify email confirmation token.
```
Response: { "ok": true }
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
Response: { "user": { "id": "...", "email": "...", "is_verified": true } }
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
### POST /generations
Create a generation record (logged-in only).
```
Request: { "category": "portraits", "inputUrl": "https://..." }
Response: { "generation": { "id": "...", "status": "queued", "category": "...", "created_at": "..." } }
```

### POST /generations/:id/complete
Mark a generation as complete (logged-in only).
```
Request: { "outputUrl": "https://...", "status": "completed" }
Response: { "ok": true }
```

### GET /generations
List recent generations for the logged-in user.
```
Response: [
  { "id": "...", "status": "completed", "category": "portraits", "outputUrl": "https://...", "createdAt": "..." }
]
```
