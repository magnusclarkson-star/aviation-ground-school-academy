#!/usr/bin/env bash
# SYNTHETIC CI DATA ONLY. This is a recovery rehearsal, NOT a real student backup.
set -Eeuo pipefail
if [[ "${CI:-}" != "true" || "${ACADEMY_BACKUP_TEST_FIXTURE:-}" != "true" ]]; then
  echo "Refusing non-CI backup rehearsal; use approved production backup procedures" >&2
  exit 2
fi
if [[ "${PGHOST:-}" != "127.0.0.1" || "${PGUSER:-}" != "academy_test" || "${PGDATABASE:-}" != "academy_test" ]]; then
  echo "Refusing backup rehearsal outside the disposable Academy test DB" >&2
  exit 2
fi
umask 077
tempdir="$(mktemp -d)"
restore_db="academy_restore_ci"
cleanup() {
  rm -rf -- "$tempdir"
  dropdb --if-exists "$restore_db" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Force PostgreSQL 16 dump/restore clients to match the PG16 test service.
# Newer runner images ship clients that may emit transaction_timeout settings
# unknown to PG16; using the matching version prevents false recovery failures.
pg16() {
  docker run --rm --network host \
    -v "$tempdir:/academy-recovery" \
    -e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE \
    postgres:16-alpine "$@"
}
# The dump never leaves the runner or becomes a GitHub Actions artifact.
pg16 pg_dump --format=custom --no-owner --no-acl \
  --file=/academy-recovery/test-academy.dump "$PGDATABASE"
test -s "$tempdir/test-academy.dump"
pg16 pg_restore --list /academy-recovery/test-academy.dump > "$tempdir/toc.txt"
grep -q 'academy_users' "$tempdir/toc.txt"
grep -q 'academy_audit_events' "$tempdir/toc.txt"
createdb "$restore_db"
pg16 pg_restore --clean --if-exists --no-owner --no-acl --exit-on-error \
  --dbname="$restore_db" /academy-recovery/test-academy.dump

# Role grants are deliberately NOT part of a portable data backup. The
# migration operator must reapply runtime ACLs in each restoration.
psql -X -v ON_ERROR_STOP=1 -d "$restore_db" -f academy-secure/runtime-privileges.sql >/dev/null

tables=(
 academy_users academy_invites academy_sessions academy_staff_mfa
 academy_authority_evidence academy_courses academy_enrolments
 academy_training_stages academy_assessment_records academy_completion_requests
 academy_audit_events academy_fee_plans academy_access_grants
 academy_manual_payment_attestations academy_document_fee_plans
 academy_document_release_grants academy_document_manual_settlements
 academy_student_document_identity academy_certificate_master_artwork
)
for table in "${tables[@]}"; do
  original="$(psql -X -Atq -d "$PGDATABASE" -c "SELECT count(*) FROM $table")"
  restored="$(psql -X -Atq -d "$restore_db" -c "SELECT count(*) FROM $table")"
  if [[ "$original" != "$restored" ]]; then
    echo "Backup mismatch in $table" >&2
    exit 1
  fi
done

# Verify meaningful test data was recovered, not merely an empty schema.
for table in academy_users academy_audit_events academy_assessment_records \
  academy_training_stages academy_staff_mfa academy_manual_payment_attestations \
  academy_document_manual_settlements; do
  count="$(psql -X -Atq -d "$restore_db" -c "SELECT count(*) FROM $table")"
  if [[ "$count" -le 0 ]]; then
    echo "Backup rehearsal missing expected synthetic records in $table" >&2
    exit 1
  fi
done

# Actual read of restored protective triggers: these UPDATEs should fail
# inside exception blocks and leave the restored database unchanged.
psql -X -v ON_ERROR_STOP=1 -d "$restore_db" <<'SQL' >/dev/null
DO $recovery$
DECLARE blocked boolean;
BEGIN
  blocked := false;
  BEGIN
    UPDATE academy_audit_events SET action=action
    WHERE id=(SELECT min(id) FROM academy_audit_events);
  EXCEPTION WHEN raise_exception THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Audit trigger not restored'; END IF;

  blocked := false;
  BEGIN
    UPDATE academy_assessment_records SET status=status
    WHERE id=(SELECT id FROM academy_assessment_records LIMIT 1);
  EXCEPTION WHEN raise_exception THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Exam trigger not restored'; END IF;

  blocked := false;
  BEGIN
    UPDATE academy_manual_payment_attestations SET notes=notes
    WHERE id=(SELECT id FROM academy_manual_payment_attestations LIMIT 1);
  EXCEPTION WHEN raise_exception THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Settlement trigger not restored'; END IF;
END
$recovery$;
SQL

# Check the restored runtime role cannot tamper with protected tables.
psql -X -Atq -v ON_ERROR_STOP=1 -d "$restore_db" <<'SQL' > "$tempdir/privileges.txt"
SET ROLE agsa_app_runtime;
SELECT current_user,
 has_schema_privilege(current_user,'public','CREATE'),
 has_table_privilege(current_user,'academy_users','SELECT'),
 has_table_privilege(current_user,'academy_audit_events','UPDATE'),
 has_table_privilege(current_user,'academy_assessment_records','DELETE'),
 has_table_privilege(current_user,'academy_document_manual_settlements','UPDATE');
RESET ROLE;
SQL
grep -q '^agsa_app_runtime|f|t|f|f|f$' "$tempdir/privileges.txt"
echo "Synthetic Academy backup/restore rehearsal passed: 19 table counts matched, recovered append-only triggers and restricted runtime ACLs."
