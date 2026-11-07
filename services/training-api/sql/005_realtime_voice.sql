-- Extend the staging-only atomic AI usage meter to 2-way realtime voice.
-- Existing text and one-shot speech counters and records are preserved.
BEGIN;
ALTER TABLE ai_daily_usage DROP CONSTRAINT IF EXISTS ai_daily_usage_kind_check;
ALTER TABLE ai_daily_usage ADD CONSTRAINT ai_daily_usage_kind_check
 CHECK (kind IN ('text','voice','realtime'));
COMMIT;
