-- Aviation Ground School Academy proposed ATO records: never publicly deployed through GitHub Pages.
-- Apply using a migration account. The application DB role must not own tables or have DDL rights.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS academy_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (length(email) BETWEEN 5 AND 254),
  role text NOT NULL CHECK (role IN ('student','instructor','examiner','quality_manager','head_of_training','accountable_manager')),
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  adult_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);
CREATE TABLE IF NOT EXISTS academy_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK(role IN ('student','instructor','examiner','quality_manager','head_of_training','accountable_manager')),
  token_hash char(64) NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES academy_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  CHECK (expires_at>created_at)
);
CREATE TABLE IF NOT EXISTS academy_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES academy_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON academy_sessions(user_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS academy_login_failures (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  last_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS academy_authority_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK(type IN ('ATO_CERTIFICATE','TRAINING_SPECIFICATIONS','COURSE_APPROVAL','EXAMINING_AUTHORITY','EXAMINER_AUTHORISATION','INSTRUCTOR_CREDENTIAL','TPM_ACCEPTANCE','SMS_ACCEPTANCE')),
  scope text NOT NULL CHECK(length(scope)>0 AND length(scope)<200),
  issuer text NOT NULL DEFAULT 'SLCAA' CHECK(issuer='SLCAA'),
  reference text NOT NULL CHECK(length(reference)>=4 AND length(reference)<250),
  sha256 char(64) NOT NULL CHECK(sha256 ~ '^[A-Fa-f0-9]{64}$'),
  effective_from timestamptz NOT NULL,
  effective_until timestamptz,
  status text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK(status IN ('PENDING_REVIEW','VERIFIED','REJECTED','REVOKED')),
  submitted_by uuid NOT NULL REFERENCES academy_users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid REFERENCES academy_users(id),
  verified_at timestamptz,
  review_notes text,
  CHECK(effective_until IS NULL OR effective_until>effective_from),
  CHECK(verified_by IS NULL OR verified_by<>submitted_by),
  CHECK((status='VERIFIED')=(verified_by IS NOT NULL AND verified_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS evidence_lookup_idx ON academy_authority_evidence(type,scope,status);
CREATE TABLE IF NOT EXISTS academy_courses (
  id text PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9_-]{2,63}$'),
  title text NOT NULL CHECK(length(title)>5 AND length(title)<250),
  revision text NOT NULL CHECK(length(revision)>0 AND length(revision)<80),
  content_sha256 char(64) NOT NULL CHECK(content_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  minutes_planned integer CHECK(minutes_planned>0),
  prerequisite_text text NOT NULL,
  stage_standard_text text NOT NULL,
  review_status text NOT NULL DEFAULT 'DRAFT' CHECK(review_status IN ('DRAFT','INTERNAL_REVIEW','READY_FOR_AUTHORITY')),
  prepared_by uuid NOT NULL REFERENCES academy_users(id),
  qa_reviewed_by uuid REFERENCES academy_users(id),
  qa_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(qa_reviewed_by IS NULL OR qa_reviewed_by<>prepared_by)
);
CREATE TABLE IF NOT EXISTS academy_enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES academy_users(id),
  course_id text NOT NULL REFERENCES academy_courses(id),
  status text NOT NULL DEFAULT 'ENROLLED' CHECK(status IN ('ENROLLED','WITHDRAWN','COMPLETE')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(student_id,course_id)
);
CREATE TABLE IF NOT EXISTS academy_training_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES academy_enrolments(id),
  stage_key text NOT NULL CHECK(length(stage_key)>0 AND length(stage_key)<100),
  status text NOT NULL CHECK(status IN ('COMPLETE','NEEDS_RETRAINING')),
  training_date date NOT NULL,
  instructor_id uuid NOT NULL REFERENCES academy_users(id),
  review_notes text NOT NULL CHECK(length(review_notes)>=10 AND length(review_notes)<3000),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrolment_id,stage_key)
);
CREATE TABLE IF NOT EXISTS academy_assessment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES academy_enrolments(id),
  course_id text NOT NULL REFERENCES academy_courses(id),
  student_id uuid NOT NULL REFERENCES academy_users(id),
  examiner_id uuid NOT NULL REFERENCES academy_users(id),
  recorded_by uuid NOT NULL REFERENCES academy_users(id),
  status text NOT NULL CHECK(status IN ('PASS','FAIL')),
  assessment_date date NOT NULL,
  blueprint_revision text NOT NULL CHECK(length(blueprint_revision)>3 AND length(blueprint_revision)<100),
  result_reference text NOT NULL CHECK(length(result_reference)>=6 AND length(result_reference)<250),
  result_sha256 char(64) NOT NULL CHECK(result_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS academy_completion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL UNIQUE REFERENCES academy_enrolments(id),
  assessment_id uuid NOT NULL REFERENCES academy_assessment_records(id),
  requested_by uuid NOT NULL REFERENCES academy_users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'PENDING_QA' CHECK(status IN ('PENDING_QA','ISSUED','REJECTED','REVOKED')),
  attested_by uuid REFERENCES academy_users(id),
  attested_at timestamptz,
  serial text UNIQUE,
  CHECK((status='ISSUED')=(serial IS NOT NULL AND attested_by IS NOT NULL AND attested_at IS NOT NULL)),
  CHECK(attested_by IS NULL OR attested_by<>requested_by)
);
CREATE TABLE IF NOT EXISTS academy_audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES academy_users(id),
  action text NOT NULL CHECK(length(action)>0 AND length(action)<120),
  resource text NOT NULL CHECK(length(resource)>0 AND length(resource)<140),
  resource_id text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
-- Audit history cannot be edited or deleted via the application runtime or even by an ordinary table owner.
CREATE OR REPLACE FUNCTION academy_block_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit events are append only'; END $$;
DROP TRIGGER IF EXISTS academy_audit_immutable ON academy_audit_events;
CREATE TRIGGER academy_audit_immutable BEFORE UPDATE OR DELETE ON academy_audit_events FOR EACH ROW EXECUTE FUNCTION academy_block_audit_mutation();

COMMIT;
