# API Endpoints

Auth: session cookie (HttpOnly, SameSite=Lax)

## Health
### GET /api/health
Simple health check for the API container.
```
Response: { "ok": true }
```

## Auth
### POST /api/auth/register
Create an account and trigger email verification.
```
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "email": "user@example.com", "verificationRequired": true } }
```

### POST /api/auth/login
Create a session cookie.
```
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "email": "user@example.com" } }
Errors: 401 invalid credentials
```

### GET /api/auth/verify?token=...
Verify email confirmation token.
```
Response: { "ok": true, "verified": true }
```

### POST /api/auth/logout
Revoke session.
```
Request: {}
Response: { "ok": true }
```

### GET /api/auth/me
Return current user.
```
Response: { "user": { "email": "..." } }
```

### POST /api/auth/resend-verification
Resend verification email for the current logged-in user.
```
Request: {}
Response: { "ok": true }
Errors: 401 not logged in, 400 already verified
```

## Guest History
### POST /api/history/clear
Clear all generations owned by the current guest session and rotate the guest cookie.
```
Response: { "cleared": true }
```

## Credits
### GET /api/credits
Return credit balance (free + paid).
```
Response: { "balance": 2, "freeCredits": 1, "userCredits": 1, "isLoggedIn": true }
```

### POST /api/credits/consume
Consume credits (free credits are used first).
```
Request: { "amount": 1 }
Response: { "balance": 1, "freeCredits": 0, "userCredits": 1 }
```

### POST /api/credits/checkout
Create a Stripe Checkout Session for purchasing credits.
```
Request: { "packId": "pack_2_5" | "pack_3_10" | "pack_5_20" }
Response: { "url": "https://checkout.stripe.com/..." }
```
Note: Credits are granted via Stripe webhook after successful payment.

## Webhooks
### POST /api/webhook
Stripe webhook endpoint. Handles payment completion and fulfills credits.
```
Auth: none (Stripe calls this)
Verification: Stripe-Signature header
Response: { "ok": true }
```
Events handled: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`

## Generations
### POST /api/generate
Create a generation job. Requires an image upload and a `type` field (style key).
```
Request (multipart/form-data):
- `type`: one of `studio-portrait`, `fashion-editorial`, `editorial-moment`, `portrait-honest`
- `image`: uploaded file

Response: { "jobId": "..." }
```

### GET /api/generate/:jobId
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

### GET /api/generations
List recent generations for the current user/guest.
Query params:
- `scope`: `auto` (default), `user`, `guest`, `all`
- `limit`: max 100
- `cursor`: ISO timestamp cursor
```
Response: { "generations": [...], "cursor": "..."? }
```

## Images
### GET /api/images/:bucket/:key
Proxy images from MinIO, with an ownership check (user session or guest session).

## Contact
### POST /api/contact
Submit a contact form message.
```
Request: { "name": "...", "email": "...", "subject": "...", "message": "..." }
Response: { "ok": true }
Validation: name required, valid email, message max 5000 chars
```
