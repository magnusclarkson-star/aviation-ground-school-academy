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
  CHECK(status<>'VERIFIED' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
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
CREATE TABLE IF NOT EXISTS academy_course_stage_requirements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 course_id text NOT NULL REFERENCES academy_courses(id),
 stage_key text NOT NULL CHECK(length(stage_key)>0 AND length(stage_key)<100),
 standard text NOT NULL CHECK(length(standard)>=25 AND length(standard)<2500),
 planned_minutes integer CHECK(planned_minutes>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(course_id,stage_key)
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
  CHECK(length(stage_key)>0)
);
CREATE INDEX IF NOT EXISTS training_stage_history_idx ON academy_training_stages(enrolment_id,stage_key,recorded_at DESC);
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
  CHECK(status<>'ISSUED' OR (serial IS NOT NULL AND attested_by IS NOT NULL AND attested_at IS NOT NULL)),
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
CREATE OR REPLACE FUNCTION academy_block_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $audit_body$
BEGIN
 RAISE EXCEPTION 'audit events are append only';
END;
$audit_body$;
DROP TRIGGER IF EXISTS academy_audit_immutable ON academy_audit_events;
CREATE TRIGGER academy_audit_immutable BEFORE UPDATE OR DELETE ON academy_audit_events FOR EACH ROW EXECUTE FUNCTION academy_block_audit_mutation();

CREATE OR REPLACE FUNCTION academy_block_training_mutation() RETURNS trigger LANGUAGE plpgsql AS $training_body$
BEGIN
 RAISE EXCEPTION 'training and examination records are append only';
END;
$training_body$;
DROP TRIGGER IF EXISTS academy_stage_immutable ON academy_training_stages;
CREATE TRIGGER academy_stage_immutable BEFORE UPDATE OR DELETE ON academy_training_stages FOR EACH ROW EXECUTE FUNCTION academy_block_training_mutation();
DROP TRIGGER IF EXISTS academy_exam_immutable ON academy_assessment_records;
CREATE TRIGGER academy_exam_immutable BEFORE UPDATE OR DELETE ON academy_assessment_records FOR EACH ROW EXECUTE FUNCTION academy_block_training_mutation();
-- Fee and scholarship administration belongs only to the accountable manager.
-- Money is represented in integer hundredths of the selected currency.
-- This schema records ADMINISTRATIVE access, not regulator-approved training credit.
CREATE TABLE IF NOT EXISTS academy_fee_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 course_id text NOT NULL REFERENCES academy_courses(id),
 country_code char(2) NOT NULL CHECK(country_code ~ '^[A-Z]{2}$'),
 currency char(3) NOT NULL CHECK(currency IN ('SLE','USD','GBP','EUR','CAD','AUD')),
 billing_period text NOT NULL CHECK(billing_period IN ('ONE_TIME','MONTHLY','QUARTERLY','YEARLY')),
 amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 0 AND 100000000000),
 status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','ARCHIVED')),
 created_by uuid NOT NULL REFERENCES academy_users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 archived_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS fee_current_plan_idx ON academy_fee_plans(course_id,country_code,currency,billing_period)
 WHERE status='ACTIVE';
CREATE TABLE IF NOT EXISTS academy_access_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 student_id uuid NOT NULL REFERENCES academy_users(id),
 course_id text NOT NULL REFERENCES academy_courses(id),
 fee_plan_id uuid NOT NULL REFERENCES academy_fee_plans(id),
 grant_type text NOT NULL CHECK(grant_type IN ('PAID','SCHOLARSHIP','WAIVER','PROMOTION','FREE')),
 discount_bps integer NOT NULL CHECK(discount_bps BETWEEN 0 AND 10000),
 gross_minor bigint NOT NULL CHECK(gross_minor BETWEEN 0 AND 100000000000),
 discount_minor bigint NOT NULL CHECK(discount_minor>=0 AND discount_minor<=gross_minor),
 payable_minor bigint NOT NULL CHECK(payable_minor=gross_minor-discount_minor),
 currency char(3) NOT NULL CHECK(currency IN ('SLE','USD','GBP','EUR','CAD','AUD')),
 country_code char(2) NOT NULL,
 billing_period text NOT NULL CHECK(billing_period IN ('ONE_TIME','MONTHLY','QUARTERLY','YEARLY')),
 status text NOT NULL CHECK(status IN ('ACTIVE','PENDING_PAYMENT','REVOKED','EXPIRED')),
 reason text NOT NULL CHECK(length(reason) BETWEEN 8 AND 1000),
 awarded_by uuid NOT NULL REFERENCES academy_users(id),
 awarded_at timestamptz NOT NULL DEFAULT now(),
 starts_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz,
 activated_at timestamptz,
 revoked_by uuid REFERENCES academy_users(id),
 revoked_at timestamptz,
 revoked_reason text,
 CHECK (expires_at IS NULL OR expires_at>starts_at),
 CHECK (status<>'ACTIVE' OR (activated_at IS NOT NULL AND payable_minor>=0)),
 CHECK (status<>'REVOKED' OR (revoked_by IS NOT NULL AND revoked_at IS NOT NULL AND length(revoked_reason)>=8)),
 CHECK ((grant_type<>'PAID' OR discount_bps=0) AND
       (grant_type<>'WAIVER' OR discount_bps=10000) AND
       (grant_type<>'FREE' OR (discount_bps=10000 AND gross_minor=0)) AND
       (grant_type NOT IN ('SCHOLARSHIP','PROMOTION') OR discount_bps>0))
);
CREATE UNIQUE INDEX IF NOT EXISTS active_student_course_grant_idx
 ON academy_access_grants(student_id,course_id) WHERE status IN ('ACTIVE','PENDING_PAYMENT');
CREATE INDEX IF NOT EXISTS access_student_course_idx ON academy_access_grants(student_id,course_id,awarded_at DESC);
CREATE TABLE IF NOT EXISTS academy_manual_payment_attestations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 grant_id uuid NOT NULL UNIQUE REFERENCES academy_access_grants(id),
 amount_minor bigint NOT NULL CHECK(amount_minor>0),
 currency char(3) NOT NULL CHECK(currency IN ('SLE','USD','GBP','EUR','CAD','AUD')),
 reference text NOT NULL CHECK(length(reference) BETWEEN 6 AND 250),
 evidence_sha256 char(64) NOT NULL CHECK(evidence_sha256 ~ '^[a-fA-F0-9]{64}$'),
 notes text NOT NULL CHECK(length(notes) BETWEEN 12 AND 1000),
 attested_by uuid NOT NULL REFERENCES academy_users(id),
 attested_at timestamptz NOT NULL DEFAULT now()
);
-- Money evidence and grant award history cannot be rewritten, even when access
-- changes. Revocation is a separate, auditable transition, not a deletion.
CREATE OR REPLACE FUNCTION academy_protect_fee_history() RETURNS trigger LANGUAGE plpgsql AS $fee_history$
BEGIN
 RAISE EXCEPTION 'fee plans and manual payment attestation history cannot be deleted or rewritten';
END;
$fee_history$;
DROP TRIGGER IF EXISTS academy_payment_immutable ON academy_manual_payment_attestations;
CREATE TRIGGER academy_payment_immutable BEFORE UPDATE OR DELETE ON academy_manual_payment_attestations
 FOR EACH ROW EXECUTE FUNCTION academy_protect_fee_history();

-- One private, encrypted signature sample per accountable-manager account.
-- Never put the signature image or its decryption key in the GitHub repository
-- or a public Academy asset. Revocation deletes encrypted image bytes.
CREATE TABLE IF NOT EXISTS academy_admin_signatures (
 owner_id uuid PRIMARY KEY REFERENCES academy_users(id),
 encrypted_png bytea NOT NULL CHECK(octet_length(encrypted_png) BETWEEN 50 AND 145016),
 nonce bytea NOT NULL CHECK(octet_length(nonce)=12),
 auth_tag bytea NOT NULL CHECK(octet_length(auth_tag)=16),
 sha256 char(64) NOT NULL CHECK(sha256 !~ '[^a-f0-9]'),
 image_width integer NOT NULL CHECK(image_width BETWEEN 240 AND 1600),
 image_height integer NOT NULL CHECK(image_height BETWEEN 70 AND 800),
 preferences jsonb NOT NULL DEFAULT '{"formalCertificates":false,"scoutCertificates":false,"enthusiastCertificates":false,"transcripts":false,"academySeal":false}'::jsonb,
 uploaded_at timestamptz NOT NULL DEFAULT now(),
 changed_at timestamptz NOT NULL DEFAULT now(),
 CHECK(jsonb_typeof(preferences)='object')
);

COMMIT;
