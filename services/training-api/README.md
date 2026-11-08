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


## V0.2 — Same-origin student and instructor dashboard (staging only)

A new browser dashboard lives in `portal/index.html`, `portal/styles.css`, and `portal/app.js`, served by this backend at **`/portal/`**. The frontend is intentionally **not connected to the public GitHub Pages Academy**. Starting the private backend locally with `AGSA_PUBLIC_ORIGIN=http://127.0.0.1:3100` makes it available at `http://127.0.0.1:3100/portal/` to *manually provisioned fictional* student/instructor accounts.

### Functional workflow

- **Login:** the portal calls `POST /api/v1/auth/login` on the *same origin*. The API, not the browser, verifies membership, password and role. Browser JavaScript never receives or stores the HttpOnly session token; password inputs are cleared after each attempt.
- **Student:** `GET /api/v1/practice-attempts` lists only the student's submissions. A user can choose an individual `agsa.practice-observation.v1` JSON report and submit it through `POST /api/v1/practice-attempts` with a random idempotency key. The browser enforces a convenience 32 KB file limit, and the server independently validates it and retains only an allowlisted **unverified** summary.
- **Instructor:** `GET /api/v1/instructor/assigned-attempts` displays only assigned students' unverified attempts, and `POST /api/v1/instructor/feedback-drafts` saves a review draft for the selected attempt. `GET /api/v1/instructor/feedback-drafts` lists the instructor's drafts. **No assessment approval, grading credential, flight credit or certificate endpoint exists.**
- **Logout:** the portal sends an authenticated, CSRF-protected `POST /api/v1/auth/logout` to revoke its session.
- **Responsive design:** the layout works with phone screens and desktop widths, including touchscreen buttons and input labels. All API-provided text is inserted with `textContent` rather than executable HTML.
- **Storage:** the private portal does not write session tokens, passwords, learner data or feedback to `localStorage`, `sessionStorage` or IndexedDB. Database persistence is server-side for simulated submissions and drafts.

The portal assets are **publicly readable code** (the login screen and bundled JS/CSS), but **student/instructor data and API operations always require authenticated server-side access**. Do not put credentials or confidential data into those files.

### Deployment separation and security boundary

The GitHub Pages deployment now builds a reviewed **public-only** artifact using `scripts/build-pages.mjs`, rather than publishing the entire repository. Only top-level intended public pages/scripts/images/styles and the public accreditation readiness JSON are published. The test `scripts/test-pages-package.mjs` verifies that `services/training-api/`, private portal files, docs, CI and internal scripts do **not** enter the GitHub Pages artifact.

This filtering prevents accidental exposure of backend file *copies via the Pages deployment*. **Repository source access is a separate issue:** this project may be a public GitHub repository, so never commit secrets, private student records or unredacted authorization documents, even if Pages excludes them.

### Automated testing

The Training API Security Checks workflow now runs the existing isolated PostgreSQL 16 security suite and a real Chromium browser test, `tests/portal.browser.mjs`, against the real HTTP handler with fictional test identities. The browser test exercises:

- Unauthenticated API denial, cookie-based sign-in, session restoration and logout.
- Student-only report submission, strict sanitization and instructor-route denial.
- Assigned instructor review and draft feedback, and denied access for an unassigned instructor.
- Small-screen role-specific mobile layouts.
- Allowlisted portal asset delivery, restrictive Content Security Policy and absence of unauthenticated student records.

**Remaining blockers for any real-world deployment:** verified account onboarding, staff MFA, session/account recovery, production rate-limit identity and proxy trust configuration, independent security audit, least-privilege PostgreSQL credentials, private backups, operational monitoring, legal/privacy review, verified instructor identities and regulatory approval decisions. Keep the backend in *isolated fictional staging* until these gates are resolved.


## Instructor MFA — staging TOTP (code implemented; no real identity verification)

An instructor **cannot sign in with a password alone**. After the password is checked, the API requires a valid **one-time 6-digit authenticator code**. The TOTP seed is generated by a trusted staging operator and encrypted with AES-256-GCM in the `instructor_mfa` table, under `AGSA_MFA_ENCRYPTION_KEY` stored outside Git. The server refuses to start without a valid 32-byte key. Staff not enrolled cannot log in; there is **no automatic staff enrolment, reset, email fallback or password-only bypass**.

To prepare *fictional staging instructors only*:

1. Run the SQL migrations including `002_instructor_mfa.sql`, and apply the database grants after migration.
2. On a trusted operator terminal, generate an encryption key locally: `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Store and back it up securely in the secret manager. **Losing it makes the enrolled TOTP seeds unreadable. Do not regenerate it at each restart.**
3. Supply `AGSA_MFA_ENCRYPTION_KEY` from that secret manager to the backend server and, only when enrolling, to the trusted provisioning process. The key is not shown in the website or API.
4. After creating a fictional instructor account, run `npm run provision -- mfa agsa-pilot pilot.teacher@example.org` from the trusted terminal with the encryption key set. This one-time operation emits a sensitive `otpauth://` URI to the terminal for secure transfer to that fictional instructor's authenticator device. **Do not paste or upload this URI into chats, GitHub, issue trackers or public QR generators.**
5. Use the six-digit code from the authenticator app in the login page's **Authenticator code** field. Students may leave this field blank. Server-side OTP verification permits ±30 seconds of clock drift and atomically rejects reused time steps, including simultaneous requests.
6. An enrolled staff account cannot self-reset its MFA seed, and the operator command deliberately refuses to overwrite an existing seed. Any future recovery flow must verify the person's identity and be audited separately; no shortcut is included in this prototype.

Staging tests exercise official RFC 6238 timing vectors, encrypted-secret tamper detection, replay prevention, multiple concurrent attempts, missing enrolment and password-only login denial. TOTP strengthens staging staff sign-in, but is **not phishing-resistant**, and there is no verification of instructor qualifications or email control. WebAuthn/passkeys, staff recovery, email verification and real identity checks remain future production work.



## V0.3 — Invitation-only email ownership verification

**New staging behavior:** All previously provisioned accounts start with `users.email_verified_at=NULL`. The API **refuses sign-in and denies any existing sessions** until an invitation is actually delivered to the mailbox and its owner explicitly confirms the link. New accounts remain unverified by default. Email verification does not establish a real-world identity, age, instructor qualification, or any official academic/aviation approval.

The migration `sql/003_email_verification.sql` introduces hashed single-use invitation tokens, 30-minute expiry, and a tightly scoped PostgreSQL `SECURITY DEFINER` function that atomically consumes a valid token and marks the mailbox verified. The normal web DB role receives only function execution permission: it cannot directly update `users.email_verified_at` or edit invitation rows. Old sessions cannot revive after verification because sessions must be issued **after** the email verification timestamp. A replayed or expired invitation cannot activate an account.

### Optional delivery provider and operator commands

Email is **not configured or sent automatically**. For private fictional staging, the operator may configure one verified email-sending account using the **Resend HTTP email API**. No default API key, default destination, fake inbox verification, console-printed token, or public registration endpoint exists. Real sending requires a verified sender domain and working provider account, deliberately supplied outside this repository:

```sh
# Operator secrets/environment only; placeholders, not working credentials:
AGSA_MAIL_PROVIDER=resend
AGSA_RESEND_API_KEY=<operator-managed-provider-secret>
AGSA_MAIL_FROM=noreply@your-verified-staging-domain.example
AGSA_PUBLIC_ORIGIN=https://your-controlled-staging-domain.example
```

After migrations, least-privilege grants and an operator-provisioned **fictional staging** account:

```sh
# Execute only from a trusted operator terminal, never from public GitHub Pages.
npm run invite -- agsa-pilot fictional.student@example.org
```

The CLI creates a 256-bit random single-use token, saves only its SHA-256 hash, revokes earlier unused challenges for that user, and sends a message to the configured email provider. **The CLI never prints the token or link.** Provider acceptance is only evidence that a delivery request was accepted; it does not prove that the email arrived. A delivery error leaves the account unverified; reissue from the trusted terminal after correcting configuration.

The received link points to the *private* staging `/portal/` with the token in the **URL fragment**, which is not sent to the HTTP server on page load. The portal immediately clears the fragment from browser history. The recipient must click **Confirm my email address**; opening the message or link alone does not activate the account. The frontend sends the token to the same-origin `POST /api/v1/auth/verify-email` endpoint; success enables normal sign-in. There is no automatic session issuance or training record credit.

Do not put provider keys, real student email lists, live invitation links, or protected data into GitHub, GitHub Actions logs, screenshots or ChatGPT messages. Invitations are intentionally disabled if `AGSA_MAIL_PROVIDER` or a valid secure `AGSA_PUBLIC_ORIGIN` is missing. No unverified account can bypass activation through the standard login API.

**Security checks:** HTTP/browser tests cover pre-verification login denial, fragment removal, user-confirmed activation, token replay and malformed links; PostgreSQL integration tests cover expired and simultaneous tokens, audit trail, session invalidation, and prevention of arbitrary runtime email-approval updates. Unit tests cover fail-closed provider settings and sanitized delivery failures.

**Not implemented:** real student signups, a trusted email-provider account, public staging hostname, delivery-webhook receipts, invitation support operations, verified real identities or instructors, password recovery, secure MFA recovery, passkeys, production data privacy controls or regulatory accreditation. All live onboarding remains disabled until those requirements are assessed.


## V0.4 — Optional connected AI instructor and synthetic voice

The public [AI Instructor Studio](../../ai-instructor.html) works now with **six curated lessons**, three teaching styles, quizzes, device speech synthesis and optional browser dictation. This public experience explicitly states it **is not a live generative AI** and embeds no provider credentials.

The separate private staging portal includes an additional AI tutor interface: `GET /api/v1/ai/status` reports availability, `POST /api/v1/ai/ask` sends a short consented ground-school question to an operator-configured OpenAI Responses API, and `POST /api/v1/ai/voice` can generate an MP3 of a short synthetic narration. All endpoints require a verified, authenticated account (except that the public guided page has no API calls). State-changing routes enforce CSRF. Provider keys and model choices are server-controlled; no CORS is available to the public Pages site.

**Paid provider calls are disabled by default.** Enable only in a private staging deployment with explicit operator configuration: `AGSA_AI_ENABLED=1`, `OPENAI_API_KEY` in a secret manager and optionally `AGSA_AI_VOICE_ENABLED=1`. A provider account with budget controls, verified appropriate data handling and actual private staging hosting are prerequisites. All CI tests mock the provider, never calling it or billing an account.

To control spend, `sql/004_ai_usage.sql` adds **atomic per-account, per-organisation daily usage reservations**: maximum 12 AI questions and 5 generated-voice clips per UTC day, with 500-character input questions, 440 output tokens and 700-character speech requests. The audio is limited to 900 KB. There is no automatic AI-driven assessment or credential issuance. The private portal requires explicit student acknowledgment before sending a question to the provider and stores no conversation history in local storage.

**Provider lifecycle warning:** the optional `gpt-4o-mini-tts` Speech API adapter is deprecated and scheduled for shutdown on **6 January 2027**. Its long-term replacement will require a reviewed `gpt-realtime-2.1-mini` Realtime API design, not a drop-in model swap. Device speech continues to work independently where supported. Connected AI is not currently hosted or configured with a paid provider.

Detailed architecture and operational restrictions: [AI Instructor and Voice Guide](../../docs/AI-INSTRUCTOR-VOICE.md).


## V0.5 — Private two-way AI voice tutor (WebRTC staging foundation)

The private dashboard now supports `/api/v1/ai/realtime-connect` and `/api/v1/ai/realtime-end`. On a user-confirmed, authenticated request, the browser asks permission for its microphone and sends a bounded SDP offer **to this same-origin API**, not a provider key. The server combines the offer with its own fixed educational session configuration and exchanges it using OpenAI's **GA `POST /v1/realtime/calls` unified WebRTC API**. The browser then uses the returned SDP answer for microphone audio and synthetic instructor speech. It never sees a long-lived API key or short-lived provider token.

**Default is disabled**: for fictional staging ONLY, a trusted operator must explicitly set all three `AGSA_AI_ENABLED=1`, `AGSA_AI_REALTIME_ENABLED=1`, `AGSA_AI_REALTIME_STAGING_APPROVED=1`, supply `OPENAI_API_KEY` from a private secret manager, **and set a valid `AGSA_AI_REALTIME_ALLOWED_USER_IDS` allowlist for independently vetted adult fictional testers**. No API key or account is preconfigured and no live paid voice calls have been made in tests.

Safety and spend constraints: a verified login and CSRF token are mandatory; explicit voice consent is required for each call. A validated lesson topic, teaching style and synthetic voice are the only client-selectable settings; model `gpt-realtime-2.1-mini`, AI instructions and token limits remain server-owned. The voice tutor includes a **two-minute client timer** and the private server attempts to end each call through **`POST /v1/realtime/calls/{call_id}/hangup`** after 120 seconds. Staging permits **only one unresolved voice session per user and organisation across API replicas** via a PostgreSQL uniqueness constraint, and two new session reservations per account per UTC day. The student may manually mute or end a call; sign-out triggers server hangup. Local, nonpersisted generated transcripts may appear in the browser.

**Important production caveat:** Migration `006_realtime_call_registry.sql` adds persistent call records and a restart-recoverable hangup retry worker. It must be installed before the private API can start. Provider failures, a fully offline deployment or a crash before provider ID persistence can still leave a billable call running; uncertain calls are deliberately not marked closed. These remain *best-effort controls, not a hard financial cap*: require provider-side billing limits, monitoring and independent manual reconciliation before any real paid rollout. The user interface does not grant qualification, course credit, approved training time or real-time flight guidance. Unverified minors should not be onboarded without the separate safeguarding design.

Automated CI now checks session validation, no external provider credentials in responses, simulated backend handshakes, mock provider hangup, access and quota boundaries, and fake desktop/mobile WebRTC browser flows. All provider calls in CI are mocked.

See [AI Instructor and Voice Engineering Guide](../../docs/AI-INSTRUCTOR-VOICE.md).


**Pilot eligibility/microphone permission:** see [VOICE-PILOT-SECURITY.md](./VOICE-PILOT-SECURITY.md). Unapproved accounts are denied before provider calls or reservations; age verification is not implemented. Backend call expiry is still best-effort.

## V0.6 — Authenticated module self-check imports (private staging)

The private portal now includes a **student-only module import** and **assigned-instructor read-only module overview**, separate from public browser-local self-study. Students can select one item from a small unsigned JSON export from `ground-school-modules.html`; the backend validates its module, content revision and claimed score, and stores only an **unverified** account-scoped receipt. Neither the public learner page nor the private backend claims the answers were observed or graded.

Three new endpoints are available after migration `007_module_practice_claims.sql`:

- `POST /api/v1/learning/module-claims` — student + CSRF + idempotency key; 24 new imports per student/UTC day.
- `GET /api/v1/learning/module-claims` — student, own results only.
- `GET /api/v1/instructor/assigned-module-claims` — instructor, read-only, current active same-organisation assignments only.

The application DB role receives SELECT/INSERT (but not UPDATE/DELETE) to the new table. SQL constraints prevent "approved" or credit-bearing states. No real learners or children should be onboarded; there is no public enrolment or grade certification. See [Private Module Claim Import and Security](PRIVATE-MODULE-CLAIMS.md) for exact payload, deployment order, tests and remaining safeguarding requirements.

