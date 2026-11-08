# Private module practice claim ingestion — staging only

**Status:** source-code implementation and synthetic CI tests. **Not connected to the public GitHub Pages Academy, and not deployed to a live private API.** No real learners, minors, personal student records, verified assessment, accredited course or authorised instructor sign-off.

## What this phase introduces

The public [Ground-School Module Practice](../../ground-school-modules.html) page lets a person complete four introductory modules on their own device and export an editable JSON summary. The public page deliberately has no sign-in and never sends learner information to a private account.

The isolated private staging portal can **optionally import one selected result** from such an unsigned file using a previously provisioned fictional adult student account. The backend stores only:

- authenticated organisation and user UUIDs (from the server-side session, **never** from the uploaded JSON);
- a fixed module ID, fixed assessment revision `2026-11-08.1`, and claimed number correct out of six;
- server receipt timestamp, opaque idempotency key, payload hash and immutable `UNVERIFIED_CLIENT_SELF_CHECK` status.

It **does not store** the source file, personal names from it, answers, microphone audio, children’s data, certificates or regulator-approved grades. Client-supplied identity or approval fields are rejected. A browser-editable answer key exists, so the score is **not** independently authenticated just because the account and database are authenticated.

## Private API and role boundaries

All endpoints require a current, active same-origin session. POST uses exact-origin checks, session CSRF header/cookie and an `Idempotency-Key` header (12–80 safe characters).

| Method and route | Allowed access | Result |
|---|---|---|
| `POST /api/v1/learning/module-claims` | Student + CSRF | Create one unverified module self-check receipt; 24 newly created submissions per account per UTC day |
| `GET /api/v1/learning/module-claims?limit=20` | Student | List only that account's own receipts, up to 50 |
| `GET /api/v1/instructor/assigned-module-claims?limit=20` | Instructor with existing MFA-authenticated session | Read-only summaries for actively assigned learners in the same organisation, with active student membership |

The POST body must contain **only** these fields:

```json
{
  "schema": "agsa.private.module-practice-claim.v1",
  "moduleId": "foundations",
  "revision": "2026-11-08.1",
  "correct": 5,
  "total": 6
}
```

Modules: `foundations`, `cockpit`, `operations`, `awareness`. `correct` is a self-reported integer from zero to six. Changed payloads with the same student-scoped idempotency key get 409; exact retries get the original receipt. The 24/day limit applies to new records only. The backend re-checks active student membership during the database transaction. Instructor queries join current active assignment and membership on every request; merely knowing a student ID does not grant access.

The table `module_practice_claims` has CHECK constraints permanently preventing `flight_credit=true`, `certificate_eligible=true` or any source status other than `UNVERIFIED_CLIENT_SELF_CHECK`. The application database role can SELECT and INSERT but cannot UPDATE or DELETE these records. Audit events are appended on first successful creation, not on replay. These constraints support auditability of an *unverified claim*, not proof that the score is true.

## Deployment order for an isolated operator

1. Keep the private API and database isolated from GitHub Pages and from Salone One. Use only operator-provisioned fictional adult accounts.
2. Apply `sql/007_module_practice_claims.sql` **before** restarting the updated service, using the migration-only database role (the normal `scripts/migrate.mjs` includes it).
3. Reapply reviewed least-privilege DB grants with `scripts/apply-grants.mjs` using the separate operator-owned migration credentials.
4. Run the complete training API suite with a disposable local test PostgreSQL database; check the least-privilege role denies updates to stored claims, tenant crossover and revoked assignments.
5. Start the private same-origin HTTPS staging portal and import one synthetic JSON downloaded from the public module page. Select a result, explicitly submit, and verify it appears only in that fictional account. Use an MFA-authenticated assigned instructor to view its **read-only unverified** summary.
6. Confirm current backup, retention, revocation, incident response and legal/safeguarding requirements *before* ever considering real student records. This phase does not implement those policies.

No API keys, student data or private portal assets are added to the public Academy bundle.

## Limitations and future regulated training work

This release is **not an LMS of record**. Uploaded JSON can be edited, answers are visible in the public JS, scores are self-reported, and the DB validates only data shape, ownership and rights to read a claim. Secure course enrolment, reviewer qualification verification, independently observed tests, server-controlled assessment question delivery, versioned syllabus approval, instructor signatures, guardian consent, age checks, data deletion/retention and regulator requirements remain outstanding. Do not treat authenticated storage as authenticated grades.

The public Academy remains usable without any private account or server. Connecting real learners automatically would require a separate protected same-origin application and explicit consent/child-safety design. Browser-local practice remains the default.
