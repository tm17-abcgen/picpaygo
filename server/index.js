import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

dotenv.config();

const app = express();
app.set("trust proxy", true);

const PORT = process.env.API_PORT || 8081;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8082";

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const schemaSql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generation_status') THEN
    CREATE TYPE generation_status AS ENUM ('queued', 'processing', 'completed', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_kind') THEN
    CREATE TYPE asset_kind AS ENUM ('input', 'output');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_reason') THEN
    CREATE TYPE credit_reason AS ENUM ('purchase', 'generation', 'refund', 'bonus', 'admin_adjustment');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credits (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  status generation_status NOT NULL DEFAULT 'queued',
  error_message text,
  input_url text,
  output_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS ip_credits (
  ip_address inet PRIMARY KEY,
  free_remaining integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS input_url text;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS output_url text;
`;

const SESSION_COOKIE = "session";
const SESSION_TTL_HOURS = 24 * 7;
const VERIFY_TTL_HOURS = 24;
const VERIFY_BASE_URL = process.env.VERIFY_BASE_URL || "http://localhost:8082/verify";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "127.0.0.1";
};

const ensureSchema = async () => {
  await pool.query(schemaSql);
};

const ensureUserCredits = async (userId) => {
  await pool.query(
    `INSERT INTO credits (user_id, balance)
     VALUES ($1, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
};

const getIpCredits = async (ip) => {
  const { rows } = await pool.query(
    `INSERT INTO ip_credits (ip_address, free_remaining)
     VALUES ($1, 3)
     ON CONFLICT (ip_address) DO UPDATE SET last_seen_at = now()
     RETURNING free_remaining`,
    [ip]
  );
  return rows[0]?.free_remaining ?? 0;
};

const setIpCredits = async (ip, remaining) => {
  await pool.query(
    `UPDATE ip_credits SET free_remaining = $2, last_seen_at = now() WHERE ip_address = $1`,
    [ip, remaining]
  );
};

const getUserCredits = async (userId) => {
  await ensureUserCredits(userId);
  const { rows } = await pool.query(`SELECT balance FROM credits WHERE user_id = $1`, [userId]);
  return rows[0]?.balance ?? 0;
};

const setUserCredits = async (userId, balance) => {
  await pool.query(`UPDATE credits SET balance = $2, updated_at = now() WHERE user_id = $1`, [userId, balance]);
};

const createSession = async (res, userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO sessions (user_id, session_token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: expiresAt,
  });
};

const createVerification = async (userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_HOURS * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO email_verifications (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
};

const getSessionUser = async (req) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `SELECT users.id, users.email
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.session_token_hash = $1
       AND sessions.expires_at > now()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
};

const clearSession = async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    const tokenHash = hashToken(token);
    await pool.query(`DELETE FROM sessions WHERE session_token_hash = $1`, [tokenHash]);
  }
  res.clearCookie(SESSION_COOKIE);
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const email = (req.body?.email || "").toLowerCase().trim();
  const password = req.body?.password || "";
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const existing = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
  if (existing.rowCount > 0) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email`,
    [email, passwordHash]
  );

  const user = rows[0];
  await ensureUserCredits(user.id);
  const token = await createVerification(user.id);

  // Minimal email confirmation: log verification link for now.
  // Replace with a real email provider in production.
  // eslint-disable-next-line no-console
  console.log(`Verify email for ${email}: ${VERIFY_BASE_URL}?token=${token}`);

  return res.json({ user, verificationRequired: true });
});

app.post("/api/auth/login", async (req, res) => {
  const email = (req.body?.email || "").toLowerCase().trim();
  const password = req.body?.password || "";
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const { rows } = await pool.query(`SELECT id, email, password_hash, is_verified FROM users WHERE email = $1`, [email]);
  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.is_verified) {
    return res.status(403).json({ error: "Email not verified" });
  }

  await pool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
  await createSession(res, user.id);
  return res.json({ user: { id: user.id, email: user.email } });
});

app.get("/api/auth/verify", async (req, res) => {
  const token = req.query?.token;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing token" });
  }

  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `SELECT user_id FROM email_verifications
     WHERE token_hash = $1
       AND expires_at > now()
     LIMIT 1`,
    [tokenHash]
  );
  const record = rows[0];
  if (!record) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  await pool.query(`UPDATE users SET is_verified = true WHERE id = $1`, [record.user_id]);
  await pool.query(`DELETE FROM email_verifications WHERE token_hash = $1`, [tokenHash]);
  return res.json({ ok: true });
});

app.post("/api/auth/logout", async (req, res) => {
  await clearSession(req, res);
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.json({ user: null });
  }
  const { rows } = await pool.query(`SELECT is_verified FROM users WHERE id = $1`, [user.id]);
  res.json({ user: { ...user, is_verified: rows[0]?.is_verified ?? false } });
});

app.get("/api/credits", async (req, res) => {
  const user = await getSessionUser(req);
  const ip = getClientIp(req);
  const freeCredits = await getIpCredits(ip);
  const userCredits = user ? await getUserCredits(user.id) : 0;
  res.json({
    balance: freeCredits + userCredits,
    freeCredits,
    userCredits,
    isLoggedIn: !!user,
  });
});

app.post("/api/credits/consume", async (req, res) => {
  const amount = Math.max(parseInt(req.body?.amount || "1", 10), 1);
  const user = await getSessionUser(req);
  const ip = getClientIp(req);
  const freeCredits = await getIpCredits(ip);
  const userCredits = user ? await getUserCredits(user.id) : 0;
  const total = freeCredits + userCredits;

  if (total < amount) {
    return res.status(400).json({ error: "Insufficient credits" });
  }

  let remainingToDeduct = amount;
  let updatedFree = freeCredits;
  let updatedUser = userCredits;

  if (updatedFree > 0) {
    const consume = Math.min(updatedFree, remainingToDeduct);
    updatedFree -= consume;
    remainingToDeduct -= consume;
    await setIpCredits(ip, updatedFree);
  }

  if (remainingToDeduct > 0) {
    if (!user) {
      return res.status(400).json({ error: "Login required for paid credits" });
    }
    updatedUser = Math.max(updatedUser - remainingToDeduct, 0);
    await setUserCredits(user.id, updatedUser);
  }

  res.json({
    balance: updatedFree + updatedUser,
    freeCredits: updatedFree,
    userCredits: updatedUser,
  });
});

app.post("/api/credits/checkout", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Login required" });
  }
  const packSize = parseInt(req.body?.packSize || "0", 10);
  if (![5, 10, 20].includes(packSize)) {
    return res.status(400).json({ error: "Invalid pack size" });
  }
  const current = await getUserCredits(user.id);
  await setUserCredits(user.id, current + packSize);
  res.json({ ok: true, added: packSize });
});

const requireUser = async (req, res, next) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Login required" });
  }
  req.user = user;
  return next();
};

app.post("/api/generations", requireUser, async (req, res) => {
  const category = req.body?.category || "portraits";
  const inputUrl = req.body?.inputUrl || null;
  const { rows } = await pool.query(
    `INSERT INTO generations (user_id, category, status, input_url)
     VALUES ($1, $2, 'queued', $3)
     RETURNING id, status, category, created_at`,
    [req.user.id, category, inputUrl]
  );
  res.json({ generation: rows[0] });
});

app.post("/api/generations/:id/complete", requireUser, async (req, res) => {
  const id = req.params.id;
  const outputUrl = req.body?.outputUrl || null;
  const status = req.body?.status || "completed";
  await pool.query(
    `UPDATE generations
     SET status = $1, output_url = $2, completed_at = now()
     WHERE id = $3 AND user_id = $4`,
    [status, outputUrl, id, req.user.id]
  );
  res.json({ ok: true });
});

app.get("/api/generations", requireUser, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, status, category, output_url, created_at
     FROM generations
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  );
  const results = rows.map((row) => ({
    id: row.id,
    status: row.status,
    category: row.category,
    outputUrl: row.output_url,
    createdAt: row.created_at,
  }));
  res.json(results);
});

app.listen(PORT, async () => {
  await ensureSchema();
  // eslint-disable-next-line no-console
  console.log(`API running on :${PORT}`);
});
