-- Apply AFTER schema.sql as migration/DBA operator in a DEDICATED Academy DB.
-- Runtime role is NOLOGIN; grant it to a separate LOGIN account provisioned by
-- the database administrator. Do not put any passwords or production role names
-- beyond this NOLOGIN group in source control.
-- This file is deliberately idempotent and grants no DDL, TRIGGER or superuser.
BEGIN;
DO $role$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='agsa_app_runtime') THEN
  CREATE ROLE agsa_app_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
 END IF;
END
$role$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO agsa_app_runtime;

-- Read operations required by audited Academy API routes.
GRANT SELECT ON
 academy_users, academy_invites, academy_sessions, academy_staff_mfa,
 academy_login_failures, academy_authority_evidence, academy_courses,
 academy_course_stage_requirements, academy_enrolments, academy_training_stages,
 academy_assessment_records, academy_completion_requests, academy_audit_events,
 academy_fee_plans, academy_access_grants, academy_manual_payment_attestations,
 academy_admin_signatures, academy_document_fee_plans,
 academy_student_document_identity, academy_document_release_grants,
 academy_document_manual_settlements, academy_document_layouts,
 academy_course_certificate_templates, academy_certificate_master_artwork
TO agsa_app_runtime;

-- Inserts are bounded by the application role gates, table checks and FKs.
-- No direct runtime SQL entrypoint is exposed to users.
GRANT INSERT ON
 academy_users, academy_invites, academy_sessions, academy_staff_mfa,
 academy_login_failures, academy_authority_evidence, academy_courses,
 academy_course_stage_requirements, academy_enrolments, academy_training_stages,
 academy_assessment_records, academy_completion_requests, academy_audit_events,
 academy_fee_plans, academy_access_grants, academy_manual_payment_attestations,
 academy_admin_signatures, academy_document_fee_plans,
 academy_student_document_identity, academy_document_release_grants,
 academy_document_manual_settlements, academy_document_layouts,
 academy_course_certificate_templates, academy_certificate_master_artwork
TO agsa_app_runtime;

-- Only explicitly mutable business state may be updated.
-- Protected audit, training, examinations and settlement history have NO
-- runtime UPDATE or DELETE grant, in addition to immutable triggers.
GRANT UPDATE ON
 academy_users, academy_invites, academy_sessions, academy_staff_mfa,
 academy_login_failures, academy_authority_evidence, academy_courses,
 academy_completion_requests, academy_fee_plans, academy_access_grants,
 academy_admin_signatures, academy_document_fee_plans,
 academy_student_document_identity, academy_document_release_grants,
 academy_document_layouts, academy_course_certificate_templates,
 academy_certificate_master_artwork
TO agsa_app_runtime;

-- Purge login failure counters and revoke only an owned encrypted signature.
GRANT DELETE ON academy_login_failures,academy_admin_signatures TO agsa_app_runtime;

-- Generated audit identity values require sequence access on some PostgreSQL
-- configurations; no runtime role owns the sequence or its parent table.
GRANT USAGE ON SEQUENCE academy_audit_events_id_seq TO agsa_app_runtime;
COMMIT;

-- Example (DBA-managed, *not* as this SQL migration):
-- CREATE ROLE agsa_private_login LOGIN PASSWORD '<from-secret-manager>' INHERIT;
-- GRANT agsa_app_runtime TO agsa_private_login;
-- Use this separate LOGIN role in DATABASE_URL (never schema owner/superuser).
-- Verify runtime role has no CREATE on public, no DDL/trigger privilege, and
-- no UPDATE/DELETE on audit, training, exams, fees and settlement histories.
