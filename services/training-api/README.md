# AGSA Training API — Private Staging Foundation

**Version:** 0.1.0 · 7 November 2026  
**Project:** Aviation Ground School Academy (separate from Salone One)  
**Deployment status:** **SOURCE CODE + ISOLATED CI ONLY. NOT DEPLOYED TO A PUBLIC BACKEND. NOT AUTHORISED FOR REAL STUDENT RECORDS.**

This is a standalone Node.js 22 / PostgreSQL 16 backend foundation. The public Academy remains a static GitHub Pages education prototype at [Academy homepage](../../index.html). **No live login or secure training database is connected to GitHub Pages**, and no actual student enrolment is enabled.

## Scope implemented

- Manually provisioned *fictional staging users* with `student` or `instructor` roles, each restricted to an organisation membership.
- Passwords hashed with salted memory-hard **scrypt N=2^15,r=8,p=3** (a documented OWASP-compatible alternative to Argon2id). Never store plaintext passwords.
- Opaque cryptographically random session tokens; only their SHA-256 hashes are stored in PostgreSQL. Short-lived 6-hour sessions, revocation and role/status checks on every authenticated request.
- Host-only, `Secure`, `HttpOnly`, `SameSite=Strict` session cookies (local HTTP testing deliberately uses different, non-production cookie names).
- Double-submit CSRF header/cookie compared to a server-stored hash, exact-origin checks and no cross-origin resource sharing.
- Database-backed per-origin and origin+email login throttling; JSON body cap 32 KB and defensive response headers.
- Student-only submission of `agsa.practice-observation.v1` educational reports, stored as **unverified** allowlisted summaries, not original uploads; no official credit or certificates.
- Per-student idempotency keys; same payload+key replays return the same attempt, changed payloads return conflict.
- Assigned-instructor-only query and **unverified feedback draft** creation; authorisation is checked again *inside the database INSERT* in the same tenant.
- PostgreSQL source tables for organisations, users, active memberships, instructor assignments, sessions, unverified practice attempts, feedback drafts and basic audit events.
- Isolated CI with PostgreSQL 16; real database tests verify permissions, assignments, role suspension, replay safety and audit event creation.

**Not included:** public sign-up or email verification; MFA; password recovery; a student/instructor web portal; secure student identity verification; course enrolment management; electronic signatures; immutable regulator-grade audit records; official assessments; qualified simulator hours; production hosting; privacy/safeguarding approval; payment services.

## Architecture

```text
GitHub Pages (PUBLIC educational frontend)
    |
    | NOT CONNECTED: do not place live credentials here
    v
Future private Academy frontend on approved same-origin HTTPS domain
    |
    +-- /api/v1/... -> Private Node server behind verified TLS reverse proxy
                          |
                          +-- Postgres (private host, TLS, least-privilege role)
                          +-- Organisation and role-scoped training records
                          +-- Session hashes and event logs
```

There is intentionally **no CORS enabled**. A browser application must be served from the approved same origin as this private API when a secure frontend is introduced. Do not make cross-site cookie exceptions to connect directly from `github.io`.

## Local isolated staging setup (developers only)

Prerequisites: Node.js 22+, PostgreSQL 16+, a dedicated test/staging database and credentials. Use fake adult accounts and synthetic reports only.

1. Create a dedicated PostgreSQL role/database named `agsa_training_staging`. Grant the migration role schema creation privileges and keep the database off the public internet.
2. From `services/training-api`, run `npm install`. For reproducible production deployment, generate, review and commit a dependency lockfile before building a production image (currently not shipped).
3. Supply environment values through a secret manager or local ignored `.env` file loaded by your process environment. The backend **does not automatically load `.env`**. Copy keys from `.env.example` only as a reference; never commit real secrets.
4. For loopback-only developer testing, set `NODE_ENV=development`, `HOST=127.0.0.1`, `PORT=3100`, `AGSA_PUBLIC_ORIGIN=http://127.0.0.1:3100`, `AGSA_ALLOW_INSECURE_LOCAL=1`, `PGSSL_MODE=disable`, `DATABASE_URL` to your dedicated local database.
5. Run `npm run migrate`, then `npm start`. Confirm `GET http://127.0.0.1:3100/api/v1/ready` returns `{"status":"ready"}`.
6. Run `npm test` to check the pure auth and validation code. The PostgreSQL integration test is intentionally restricted to `AGSA_TEST_DATABASE_URL` at `127.0.0.1/agsa_training_test`, so run it only against a disposable test database after migrations.

Do **not** reuse Salone One's payment credentials, database, application secrets or Render service.

### Controlled staging-only account provisioning

There is deliberately **no public registration route**. A trusted terminal operator may manually add *fictional* staging identities using `npm run provision -- ...`:

```sh
npm run provision -- org agsa-pilot "AGSA Fictional Pilot" SL

# Supply AGSA_PROVISION_PASSWORD using a secret manager or securely scoped
# process environment. The CLI reads it, never accepts it on the command line,
# and does not print it.
npm run provision -- user agsa-pilot pilot.student@example.org student
npm run provision -- user agsa-pilot pilot.teacher@example.org instructor

npm run provision -- assign agsa-pilot pilot.teacher@example.org pilot.student@example.org
```

An existing email is not silently reset or escalated by the provision command. Assignment is required before an instructor can read the student's sample practice data or create a feedback draft. Changes are restricted to the organisation specified.

### Available routes

All paths begin with `/api/v1`. The examples are **API contracts**, not exposed live links.

| Method/path | Access | Response / restriction |
| --- | --- | --- |
| `GET /health` | Public | Minimal liveness; contains no student data |
| `GET /ready` | Public | Database connectivity probe |
| `POST /auth/login` | Public, same-origin JSON | Body `{email,password,organization}`; sets secure session + CSRF cookies |
| `GET /me` | Authenticated | Current account and organisation-scoped role, no password |
| `POST /auth/logout` | Authenticated + CSRF | Revokes session and expires cookies |
| `POST /practice-attempts` | Student + CSRF | Raw `agsa.practice-observation.v1` JSON, plus `Idempotency-Key` request header |
| `GET /practice-attempts?limit=20` | Student | Own attempts only, maximum 50 |
| `GET /instructor/assigned-attempts?limit=20` | Instructor | Only students with active same-organisation assignment |
| `POST /instructor/feedback-drafts` | Instructor + CSRF | `{attemptId,rubric,comments,proposedNextAction}`; only assigned student, always an unverified draft |
| `GET /instructor/feedback-drafts` | Instructor | Own feedback drafts only |

For state-changing authenticated requests, the browser reads the `__Host-AGSA-CSRF` cookie and sends the value in the `X-AGSA-CSRF` header. The session cookie `__Host-AGSA` is HttpOnly and not accessible to JavaScript. The server verifies the token hash and signed-in organisation membership.

Example report payload (entire JSON request body):

```json
{
  "schema": "agsa.practice-observation.v1",
  "createdAt": "2026-11-07T20:15:00.000Z",
  "task": {"id": "turn", "title": "Controlled bank and turn"},
  "observation": {
    "samples": 120,
    "matchedSamples": 90,
    "matchedPercent": 75,
    "observedSeconds": 12,
    "outcome": "PRACTICE_TARGET_MET"
  }
}
```

Even for authenticated students, the percentage is *self-reported* by an editable browser file. Do not equate it with observed proficiency. Fields implying `certificate`, `authorisedInstructor`, `flightCredit` or `approval` are ignored: no endpoint grants these outcomes.

### Security and deployment gates (not yet met)

1. Separate deployment and DB from the public site. Require an audited TLS reverse proxy, restricted inbound network and private, verified-TLS PostgreSQL. Production binds must be intentionally enabled by an operator after proxy isolation review.
2. Create a migration-only database role and least-privilege application roles; prevent the application role from altering or deleting audit events. Current CI uses one ephemeral test role, not the final DB privilege model.
3. Commit and review a lockfile; install pinned dependencies with a reproducible build; add dependency, SAST, secret and container scans.
4. Adopt an actual email verification/MFA/recovery/enrolment workflow, account lockout/rate-limit policy and clear data retention/safeguarding controls. Manually provisioned accounts are only staging placeholders.
5. Add verified instructor authorisation, syllabus versioning, signed decisions and tamper-evident evidence provenance — only after competent authority and approved-school workflow analysis.
6. Add production-grade, privacy-reviewed audit retention and automated breach response, backup/restore and operational monitoring.
7. Validate threats including IDOR, tenant crossover, CSRF, session fixation, spoofed forwarded IPs, account brute force, XSS, offline edits and revoked instructor assignments.
8. Do not deploy or connect real learners until legal/privacy/regulatory authorisation and a technical security review have been completed. Minors require separate safeguarding design.

For the wider architecture and accreditation context, see [Student Records Blueprint](../../docs/STUDENT-RECORDS-ARCHITECTURE.md) and [Accreditation Readiness](../../docs/ACCREDITATION-READINESS.md).

### OWASP reference principles

- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
