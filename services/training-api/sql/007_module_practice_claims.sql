-- Only authenticated, self-reported fictional module outcomes.
-- This table is not an exam ledger, grade book or certified student record.
BEGIN;
CREATE TABLE IF NOT EXISTS module_practice_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL,
  idempotency_key varchar(80) NOT NULL
    CHECK (idempotency_key ~ '^[A-Za-z0-9_-]{12,80}$'),
  payload_sha256 char(64) NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  module_id text NOT NULL CHECK (module_id IN ('foundations','cockpit','operations','awareness')),
  assessment_revision text NOT NULL CHECK (assessment_revision='2026-11-08.1'),
  claimed_correct smallint NOT NULL CHECK (claimed_correct BETWEEN 0 AND 6),
  question_count smallint NOT NULL DEFAULT 6 CHECK (question_count=6),
  source_status text NOT NULL DEFAULT 'UNVERIFIED_CLIENT_SELF_CHECK'
    CHECK (source_status='UNVERIFIED_CLIENT_SELF_CHECK'),
  flight_credit boolean NOT NULL DEFAULT false CHECK (flight_credit=false),
  certificate_eligible boolean NOT NULL DEFAULT false CHECK (certificate_eligible=false),
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,student_id,idempotency_key),
  FOREIGN KEY (student_id,organization_id)
    REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS module_practice_student_time
 ON module_practice_claims(organization_id,student_id,received_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS module_practice_assigned_time
 ON module_practice_claims(organization_id,received_at DESC,id DESC);
COMMIT;
