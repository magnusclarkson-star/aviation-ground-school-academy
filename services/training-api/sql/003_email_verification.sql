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

-- Only an atomic security-definer function can convert a valid token into
-- email_verified_at. The web database role receives EXECUTE, never permission
-- to mark accounts verified or mutate challenge rows arbitrarily.
CREATE OR REPLACE FUNCTION public.consume_email_challenge(p_hash char(64))
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $agsa$
DECLARE account_id uuid;
BEGIN
 UPDATE public.email_verification_challenges AS c
 SET consumed_at=now()
 FROM public.users AS u
 WHERE c.token_hash=p_hash
   AND c.consumed_at IS NULL
   AND c.expires_at>now()
   AND c.user_id=u.id
   AND u.status='active'
   AND u.email_verified_at IS NULL
 RETURNING c.user_id INTO account_id;
 IF account_id IS NULL THEN RETURN false; END IF;
 UPDATE public.users SET email_verified_at=now()
 WHERE id=account_id AND email_verified_at IS NULL AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Concurrent email verification state conflict'; END IF;
 INSERT INTO public.audit_events(actor_user_id,action,target_type,target_id)
 VALUES(account_id,'auth.email.verify','user',account_id);
 RETURN true;
END
$agsa$;
REVOKE ALL ON FUNCTION public.consume_email_challenge(char(64)) FROM PUBLIC;

-- The service checks verification on every authenticated request; sessions
-- issued before email verification are invalidated instead of revived later.
COMMIT;
