-- Mandatory instructor TOTP for fictional staging identities. Run as migration owner.
-- Secrets are encrypted with AES-256-GCM using AGSA_MFA_ENCRYPTION_KEY
-- managed outside the repository. A browser user cannot self-enrol or reset MFA.
BEGIN;
-- Pre-existing password-only instructor sessions remain untrusted; a session
-- must carry a freshly authenticated second-factor timestamp for staff access.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mfa_verified_at timestamptz;
CREATE TABLE IF NOT EXISTS instructor_mfa (
 organization_id uuid NOT NULL,
 instructor_id uuid NOT NULL,
 encrypted_secret text NOT NULL CHECK (length(encrypted_secret) BETWEEN 75 AND 200),
 last_used_step bigint NOT NULL DEFAULT -1 CHECK (last_used_step >= -1),
 enabled_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (organization_id,instructor_id),
 FOREIGN KEY (instructor_id,organization_id)
  REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT
);
COMMIT;
