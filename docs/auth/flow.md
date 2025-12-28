# PicPayGo Auth + Credits Flow

## Summary
Users can generate 1 image for free per IP. Buying credits requires login. Downloads are available to guests and logged-in users. Logged-in users see their generation history and credit balance. Logging out ends the session and hides user-specific content.

## User States
- **Guest (no session)**
  - Can upload and generate using free IP credit (max 1).
  - Can view results and **download outputs**.
  - **Cannot buy credits**.
  - Cannot see generation history.
- **Registered (unverified)**
  - Receives a verification email after signup.
  - Must verify email before login is allowed.
- **Logged in (verified)**
  - Can download results.
  - Can buy credits.
  - Can view generation history.
- **Logged out**
  - Session invalidated, history hidden, purchase disabled.

## Credits Rules
- Guests receive **1 free credit per IP** (tracked server-side).
- Free IP credits remain available even after login on the same IP.
- When logged in, total available credits = **free IP credits + purchased user credits**.
  - Deduct free credits first, then paid credits.
- Each generation consumes **1 credit**.
- If a generation fails, optionally refund 1 credit (server decision).
- Purchases add 5/10/20 credits to user balance.

## Generation Flow
1) User selects a photo and category.
2) Backend checks credits:
   - If logged in → use user balance.
   - If guest → use IP free balance.
3) If credits available → start job and decrement balance.
4) When completed:
   - Guest can download the result but it is **not saved to history**.
   - Logged-in user can download and see it in history.

## Purchase Flow
- Only available when **logged in**.
- If guest tries to buy credits, show login prompt.
- Checkout success triggers:
  - credit balance update
  - transaction record
  - optional receipt email

## Login / Logout Flow
- **Register**
  - Create account and send a verification email.
  - User must verify before logging in.
- **Login**
  - Allowed only after email verification.
  - Creates session cookie and loads user profile + credit balance.
  - Shows “My Generations” tab.
- **Logout**
  - Session destroyed.
  - Hide user-only tabs and purchases.
  - Keep guest free credits based on IP and downloads remain available.

## Edge Cases
- Guest uses their free credit → prompt to log in (for purchase).
- User logs out mid-session → downloads still available.
- User logs in after generating as guest → guest result is still viewable but not attached to account unless backend links by IP or upload token.
