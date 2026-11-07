-- Metering for optional paid AI tutoring and natural voice.
-- One UTC-day row per verified account, organisation and request type.
-- The counters are reserved atomically BEFORE any provider request.
BEGIN;
CREATE TABLE IF NOT EXISTS ai_daily_usage (
 organization_id uuid NOT NULL,
 user_id uuid NOT NULL,
 usage_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
 kind text NOT NULL CHECK(kind IN ('text','voice')),
 request_count integer NOT NULL DEFAULT 0 CHECK(request_count BETWEEN 0 AND 100),
 PRIMARY KEY(organization_id,user_id,usage_day,kind),
 FOREIGN KEY(user_id,organization_id)
  REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT
);
COMMIT;
