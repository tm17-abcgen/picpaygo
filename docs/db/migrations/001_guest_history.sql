-- Migration 001: Guest History Support
-- Adds guest_sessions, generation_assets tables
-- Modifies generations table to support guest ownership

-- New table for guest sessions
CREATE TABLE IF NOT EXISTS guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- New table for generation assets (MinIO metadata)
CREATE TABLE IF NOT EXISTS generation_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('input', 'output')),
  bucket text NOT NULL,
  object_key text NOT NULL,
  content_type text,
  bytes integer,
  sha256 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Modify generations table for guest ownership
-- Note: For existing databases, run these ALTER commands separately

-- 1. Make user_id nullable
ALTER TABLE generations ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest_session_id column (no foreign key initially for existing data)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS guest_session_id uuid;

-- 3. Add foreign key constraint (run after data migration if needed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generations' AND column_name = 'guest_session_id') THEN
    ALTER TABLE generations ADD CONSTRAINT generations_guest_session_fkey
      FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Add ownership check constraint
ALTER TABLE generations ADD CONSTRAINT IF NOT EXISTS generations_owner_check
  CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL);

-- 5. Drop old URL columns (data should be migrated to generation_assets first)
-- ALTER TABLE generations DROP COLUMN IF EXISTS input_url;
-- ALTER TABLE generations DROP COLUMN IF EXISTS output_url;

-- New indexes for guest queries
CREATE INDEX IF NOT EXISTS idx_generations_guest_session_id
  ON generations(guest_session_id, created_at DESC);

-- Update user_id index to include created_at for sorting
DROP INDEX IF EXISTS idx_generations_user_id;
CREATE INDEX idx_generations_user_id ON generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_assets_generation_id
  ON generation_assets(generation_id);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_last_seen
  ON guest_sessions(last_seen_at);
