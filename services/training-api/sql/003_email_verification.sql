-- Invite-only email ownership verification for fictional staging accounts.
-- Old accounts are deliberately unverified until an invitation reaches
-- the email inbox. No automatic grandfathering or approved-instructor status.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS email_verification_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
 issued_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 CHECK (expires_at > issued_at)
);
CREATE INDEX IF NOT EXISTS email_verify_user_pending ON email_verification_challenges(user_id,issued_at DESC)
 WHERE consumed_at IS NULL;

-- The service checks email verification on every authenticated request.
-- Prior sessions are automatically rendered invalid for not-yet-verified users.
COMMIT;
