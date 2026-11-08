-- Private adult-only realtime pilot: crash-recoverable provider-call ledger.
-- No audio, transcript, SDP, personal name, contact information or API key.
-- Keep unresolved rows until remote hangup is confirmed or manually reconciled.
BEGIN;
CREATE TABLE IF NOT EXISTS realtime_voice_calls (
 handle varchar(32) PRIMARY KEY CHECK(handle ~ '^[A-Za-z0-9_-]{32}$'),
 organization_id uuid NOT NULL REFERENCES organizations(id),
 user_id uuid NOT NULL REFERENCES users(id),
 owner_instance uuid NOT NULL,
 state varchar(12) NOT NULL DEFAULT 'reserved'
   CHECK(state IN ('reserved','active','ending','uncertain','closed')),
 provider_call_id varchar(150) UNIQUE
   CHECK(provider_call_id IS NULL OR provider_call_id ~ '^[A-Za-z0-9_-]{8,150}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 claim_until timestamptz,
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
 last_error_code varchar(40),
 resolved_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS realtime_voice_one_unresolved_per_actor
 ON realtime_voice_calls(organization_id,user_id) WHERE state <> 'closed';
CREATE INDEX IF NOT EXISTS realtime_voice_due_index
 ON realtime_voice_calls(next_attempt_at,expires_at)
 WHERE state IN ('reserved','active','ending');
COMMIT;
