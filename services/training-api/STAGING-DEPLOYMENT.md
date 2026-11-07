# Academy Private Staging Deployment Runbook

**Status: infrastructure prepared; not deployed.** The public Academy and cockpit stay on GitHub Pages. This runbook concerns the separate training API and instructor/student staging dashboard, which is **not yet available at any public URL**. Use fictional accounts and synthetic practice reports only.

## Deployment boundary

- **Public:** [Aviation Ground School Academy](https://magnusclarkson-star.github.io/aviation-ground-school-academy/). No real student login or training API.
- **Private staging candidate:** `services/training-api/portal/`, available only after an operator deploys the Docker/HTTPS composition to a controlled host.
- **Database:** separate managed PostgreSQL 16+ with verified TLS, private access, restricted service account and separate migration/provisioning accounts. Never reuse the Salone One database, provider keys or infrastructure credentials.
- **Access:** issue accounts only to authorised *fictional testers* until legal, data-protection, security and training-regulator review is complete.

## Prepared files

| Path | Role |
| --- | --- |
| `Dockerfile` | Non-root runtime image; `npm ci` against committed lockfile |
| `compose.staging.yml` | Caddy 80/443 ingress, internal API network access only; no published API port |
| `Caddyfile.staging` | Automatic HTTPS for an operator-controlled staging domain and reverse proxy |
| `package-lock.json` | Committed, CI-resolved and integrity-labelled dependency tree |
| `sql/001_init.sql` | Staging-only database schema |
| `src/grants.mjs` | Explicit runtime vs provisioning SQL privilege model |
| `scripts/apply-grants.mjs` | Migration-owner script to grant narrow table privileges |
| `scripts/test-staging-config.mjs` | Automated Docker/Compose and TLS boundary assertions |
| `.github/workflows/training-api.yml` | Auth, scope, database, portal browser and staging image validation |

## Operator checklist before private staging goes online

1. **Own a dedicated staging domain** (e.g. `training-staging.example.org`), configure its A/AAAA DNS record to a separately secured host, and reserve ports 80/443 exclusively for HTTPS termination. Never point real students at the staging hostname.
2. **Obtain a separate managed PostgreSQL instance**, reachable from the private host, with verified CA/TLS and restricted IP/network access. Establish backup and restoration expectations before storing anything.
3. **Create three separate database roles**, using the provider's secure admin interface: migration owner, provisioning operator, and web application runtime; no role sharing, superuser access, or migration-role inheritance for the latter two.
4. **Run migrations with the migration owner** in an isolated operator environment: `npm ci` in `services/training-api`, supply a temporary operator environment including `DATABASE_URL`, `NODE_ENV=production`, `PGSSL_MODE=verify-full`, and then `npm run migrate`.
5. **Apply least-privilege grants** with the migration owner: set `AGSA_MIGRATION_DATABASE_URL`, `AGSA_APP_DB_ROLE`, `AGSA_PROVISION_DB_ROLE`, `PGSSL_MODE=verify-full`; run `node scripts/apply-grants.mjs`. This command refuses elevated or table-owning application roles. Verify its claims with `tests/grants.test.mjs` in isolated CI.
6. **Provision fictional test users** only from a trusted operator terminal, connecting as the provisioning role (not as the API web role) with a process-scoped `AGSA_PROVISION_PASSWORD`. Use `npm run provision -- org ...`, `user ...` and `assign ...` as documented in [Training API README](README.md). Do not log, email, upload or commit generated passwords.
7. **Create an ignored local `.env.staging`** inside `services/training-api`. Include only the dedicated runtime role's `DATABASE_URL`; do not put this file in Git. If the hosting system provides secret files, prefer that instead of Docker Compose environment injection.
8. **Export hostname and ACME contact from a trusted operator shell** as `AGSA_STAGE_HOST` and `AGSA_ACME_EMAIL`. Then review the compose manifest carefully and, on the isolated host, run `docker compose -f compose.staging.yml config`, `docker compose -f compose.staging.yml up -d --build`. Keep the proxy and app image tags pinned to reviewed digests before any real-data usage.
9. **Run the staging smoke tests**, verifying that HTTPS has a valid certificate; `/portal/` shows only the sign-in page when logged out; `/api/v1/me` denies unauthenticated access; student and instructor records remain separate; `/api/v1/ready` is *not exposed* publicly through the reverse proxy; there is no direct external port 3100.
10. **Security review gate:** complete independent application and database permission audits, MFA for staff, account recovery, email verification, backup restore drills, data deletion/retention, logging/redaction, approved curriculum and qualified instructor verification *before any real learner onboarding*. **Nothing here currently creates real training credit.**

### Example environment keys (placeholders only)

```sh
# Run at the operator terminal; never commit actual values.
AGSA_STAGE_HOST=your-private-staging-domain.example
AGSA_ACME_EMAIL=operator@example.org

# In ignored .env.staging (or better, provider-managed secrets):
DATABASE_URL=postgresql://WEB_APP_ROLE:<PROTECTED_SECRET>@PRIVATE_PG_HOST:5432/agsa_staging?sslmode=verify-full
```

**Do not paste real credentials into ChatGPT, GitHub issues, terminal screenshots, or this repository.**

## CI acceptance criteria

The CI job uses disposable PostgreSQL 16, a locked package installation, SQL migration, role isolation tests, desktop/mobile Chromium flows and a Docker image build. It also validates a fictional-host Compose manifest and the Caddyfile. CI therefore provides evidence about build *structure*, not a successful deployment on a real host.

The public site deployment is separately constrained by `scripts/build-pages.mjs`: backend, local settings, CI, developer scripts and private staging portal are excluded from GitHub Pages.

## Remaining limitations

The staging dashboard is intentionally not a certified LMS. Email verification, authenticated instructor credentials, multi-factor authentication, regulatory course mapping, signed assessments, tamper-evident evidence records and production data-governance controls are **not yet implemented**. There is no demonstrated live hostname, private database, certificate, monitoring or real user account in this repository.

## Staging instructor MFA provisioning and activation

Before enabling staff access, run both migrations and grant the updated `instructor_mfa` privileges. Set `AGSA_MFA_ENCRYPTION_KEY` to a persistent, securely generated 32-byte base64url key in the backend secret environment; this is mandatory on every restart. Provision each fictional staging instructor's TOTP seed from a trusted operator terminal using `npm run provision -- mfa <organisation-slug> <instructor-email>`. The terminal prints a one-time confidential `otpauth://` enrolment URI, which must not be logged to cloud build systems or sent in public channels. Store the key separately from the database backup and restrict access to authorised test operators. Never embed the seed in the browser bundle.

For instructor sign-in, the API checks password then requires the authenticator code. It never issues an instructor session for a missing seed, wrong code or replayed time step. Students remain password-authenticated staging accounts, not identity-verified real learners.

**Not done:** provider-backed email delivery and verification, instructor qualification verification, phishing-resistant staff WebAuthn, MFA recovery, real user data protection/governance and a deployed hostname. The addition of TOTP does **not** confer accreditation or make the staging API ready for real learner records.

### MFA upgrade behaviour for existing fictional staging accounts

When `002_instructor_mfa.sql` is applied, the new `sessions.mfa_verified_at` field defaults to NULL. **Older instructor sessions are invalidated** by the API's database session query, even if the cookie has not expired. Instructors must receive their operator-enrolled TOTP secret and sign in again using both password and authenticator code. Students' existing session logic remains unchanged. Operators should verify this migration on a disposable staging database before applying it anywhere else.

OTP seed backups must be encrypted and separately protected; if the encryption key or authenticator is lost, no recovery or bypass exists in this prototype. Do not rotate the key or edit `instructor_mfa` records manually without a separately documented, verified identity-recovery workflow.


## Email verification release gate

Private staging **must** run `sql/003_email_verification.sql` after migrations 001 and 002, then reapply least-privilege database grants. Existing staging accounts become unable to sign in until their email ownership is verified. Do not alter `email_verified_at` manually or create a password-only bypass for convenience. In-flight sessions created before verification remain invalid afterwards.

To enable invitation emails for **fictional accounts only**, an operator must separately set `AGSA_MAIL_PROVIDER=resend`, `AGSA_RESEND_API_KEY`, `AGSA_MAIL_FROM` (a provider-verified sender), and the exact HTTPS `AGSA_PUBLIC_ORIGIN`, all in a secret manager or protected terminal, never Git. Use `npm run invite -- <org-slug> <fictional-email>` under the provisioning DB role. Tokens are 30-minute, one-use, database-hashed and never printed by the CLI. Email delivery is not assumed to work until an end-to-end message and user confirmation has been tested on the private staging host.

The portal uses a fragment-only invitation link and **explicit confirmation button**. The private API verifies the token atomically with narrowly delegated PostgreSQL function execution. Merely receiving an invite, or the provider accepting an email API request, does not mark the account verified. Verification of an email address is not verification of the person's identity or aviation teaching credentials.


## Optional AI Instructor — separately controlled paid-provider release

The public Academy's new [AI Instructor Studio](../../ai-instructor.html) uses browser/device voices and curated introductory teaching, with no API key or account. Never redirect the public GitHub Pages application to a private login cookie by disabling same-origin requirements.

The private backend offers `/api/v1/ai/status`, `/api/v1/ai/ask` and `/api/v1/ai/voice`, all protected by existing staging session, consent and usage-limit constraints. All paid provider calls are **OFF** unless an operator explicitly configures `AGSA_AI_ENABLED=1` with a private `OPENAI_API_KEY`, then separately `AGSA_AI_VOICE_ENABLED=1` for generated voice. Keep these values in a secret manager, not Git. Database migration `004_ai_usage.sql` and updated least-privilege grants are required before enabling the service.

Before any provider activation, verify billing limits, data-processing permissions, student/parent consent where necessary, moderation, privacy/retention rules, account abuse controls and real staging host isolation. The service allows no public AI requests and no AI-generated grades or official training records.

**Temporary voice adapter warning:** the existing optional Speech API model is deprecated and planned to shut down 6 January 2027. Plan a Realtime API replacement before considering long-lived natural-voice deployment. Full architecture: [AI Instructor and Voice Guide](../../docs/AI-INSTRUCTOR-VOICE.md).


## WebRTC speaking AI tutor: gated and unhosted

After `005_realtime_voice.sql`, the private API may optionally be configured for voice-to-voice WebRTC calls. This is distinct from the legacy one-shot MP3 Speech API. It uses the current GA `/v1/realtime/calls` endpoint and the `gpt-realtime-2.1-mini` model, with a server-held provider key, same-origin SDP exchange, microphone consent, role-scoped login, CSRF and two daily reservations per staging account.

Do not enable realtime voice until the account/provider has an approved budget and operational spending controls. A call is closed in the browser after two minutes and the server *attempts* provider-side hangup after 120 seconds, but its timer is in memory and is **not a durable billing guarantee**. Replace with a persistent call registry / retrying expiry scheduler before exposing paid voice to real learners. Restrict student eligibility, require safeguarding for minors, audit provider data handling and keep lessons framed as non-accredited education. The public Academy never needs the API key.
