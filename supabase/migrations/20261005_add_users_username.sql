-- ============================================================
-- Add `username` to users, for login by username.
--
-- Supabase Auth authenticates with an email address, so a bare
-- username like "admin" cannot be passed straight to
-- signInWithPassword. Storing the username alongside the email lets
-- POST /api/auth/login resolve an identifier with no "@" to the
-- account's email and continue as normal.
--
-- Nullable and unique: existing accounts keep working by email, and
-- accounts without a username simply cannot log in by name.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Unique, but only among rows that actually set one - multiple NULLs
-- are allowed, so accounts without a username do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
    ON users (username)
    WHERE username IS NOT NULL;

-- Case-insensitive lookup, matching how the login route resolves it.
CREATE INDEX IF NOT EXISTS idx_users_username_lower
    ON users (lower(username));