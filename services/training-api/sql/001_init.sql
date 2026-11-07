-- Academy training staging service. Do not put real student data in this prototype.
-- PostgreSQL 16+. Run with a least-privilege migration role; service role should
-- have only necessary table privileges and must not own this schema in production.
BEGIN;
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  legal_name text NOT NULL CHECK (length(legal_name) BETWEEN 2 AND 160),
  country_code char(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email=lower(email) AND length(email) BETWEEN 5 AND 254),
  password_hash text NOT NULL CHECK (length(password_hash) BETWEEN 40 AND 255),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS memberships (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('student','instructor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);
CREATE TABLE IF NOT EXISTS instructor_assignments (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  instructor_id uuid NOT NULL,
  student_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id,instructor_id,student_id),
  FOREIGN KEY (instructor_id,organization_id) REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (student_id,organization_id) REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT,
  CHECK (instructor_id <> student_id)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash char(64) PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  csrf_hash char(64) NOT NULL CHECK (csrf_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id,organization_id) REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_membership ON sessions(user_id,organization_id);

CREATE TABLE IF NOT EXISTS practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 12 AND 80),
  payload_sha256 char(64) NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  source_status text NOT NULL DEFAULT 'UNVERIFIED_BROWSER_REPORT'
    CHECK (source_status='UNVERIFIED_BROWSER_REPORT'),
  report_json jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,student_id,idempotency_key),
  FOREIGN KEY (student_id,organization_id) REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS attempts_student_time
  ON practice_attempts(organization_id,student_id,submitted_at DESC);
CREATE TABLE IF NOT EXISTS feedback_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  attempt_id uuid NOT NULL REFERENCES practice_attempts(id) ON DELETE RESTRICT,
  instructor_id uuid NOT NULL,
  rubric_json jsonb NOT NULL,
  comments text NOT NULL DEFAULT '' CHECK (length(comments)<=1200),
  proposed_next_action text NOT NULL DEFAULT '' CHECK (length(proposed_next_action)<=600),
  status text NOT NULL DEFAULT 'UNVERIFIED_DRAFT'
    CHECK (status='UNVERIFIED_DRAFT'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (instructor_id,organization_id) REFERENCES memberships(user_id,organization_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS feedback_instructor_time ON feedback_drafts(organization_id,instructor_id,created_at DESC);
CREATE TABLE IF NOT EXISTS login_throttles (
  key_hash char(64) PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 2147483647)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (length(action) BETWEEN 3 AND 90),
  target_type text CHECK (length(target_type) <= 90),
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS audit_org_time ON audit_events(organization_id,occurred_at DESC);
-- Keep audit_events separate from ordinary update/delete grants to the API role.
COMMIT;
