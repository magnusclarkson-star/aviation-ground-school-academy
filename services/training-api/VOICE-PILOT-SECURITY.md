# Two-way AI voice — private adult pilot security gate

Status: **private staging code, disabled by default**. This is not a public feature or an approved aviation training device.

## What changed

The private voice pilot uses same-origin WebRTC: authenticated user gives explicit microphone/AI processing consent, browser sends a bounded SDP offer to the Academy staging server, and the server exchanges the offer with the external realtime provider using a server-held API key.

A separate **server-enforced account allowlist** is now mandatory. The staging operator must independently verify that each account is a **consenting adult fictional pilot tester** before including its UUID. No account automatically qualifies merely because it is marked `student`, `instructor`, email-verified, or authenticated. The demo has **no age/identity verification or guardian consent system**, so it is unsafe to allow children or real students.

## Operator configuration

- Keep `AGSA_AI_ENABLED=0`, `AGSA_AI_REALTIME_ENABLED=0` and `AGSA_AI_REALTIME_STAGING_APPROVED=0` unless intentionally running the isolated pilot.
- Set `OPENAI_API_KEY` only from a private secret manager; never in GitHub Pages, browser JS, logs or chat.
- Configure `AGSA_AI_REALTIME_ALLOWED_USER_IDS` as a comma-separated list of **up to 20** real staging user UUIDs (no emails or names). These must be approved adult fictitious test accounts, recorded separately by the operator.
- A blank, malformed, oversized or duplicate-filled allowlist disables the feature. A signed-in user not on the list receives no active voice entitlement and a direct API call is forbidden before a provider request or daily reservation.
- Enable all three server-side AI/realtime approval flags only after security, privacy, spending, provider terms and staffing reviews. Verify the allowlist is limited to test IDs and revoke pilot access by removing their UUIDs and restarting the service.
- The current in-memory active-call registry does not immediately sever calls merely because the allowlist changes during a running session. End the call and restart the staging service when revoking an active tester.

## Microphone permission

The private `/portal/` HTML document responds with `Permissions-Policy: camera=(), microphone=(self), geolocation=()`. This allows **the browser to ask for microphone permission**, not automatic access. The application calls `getUserMedia` only after clicking Start and checking explicit consent. Static JS/CSS assets and API JSON retain `microphone=()`; the *public Academy GitHub Pages site* never contains this portal or provider key.

If the browser, OS or site permission denies microphone access, the voice call cannot start. Text lessons and offline device narration remain available.

## Safety and cost constraints

Each approved account is limited to two session reservations per UTC day; the backend allows one active call per account/process and attempts to hang up after 120 seconds. These are **best-effort**, not strict billing controls. A server crash, network break or upstream hangup failure can leave provider usage ongoing. Provider-side spending controls, durable expiration/reconciliation and monitoring are prerequisites for paid rollout.

No live aircraft instructions, ATC clearances, weather go/no-go advice, official assessment, qualification or licence credit. Microphone audio is sent to the external AI provider after consent; do not use real learner recordings or personal information in staging. A visible synthetic transcript is session-local and not a certified record.

## Validation gates

Run `npm test --prefix services/training-api` for API unit tests, then run the repository's Training API Security Checks workflow (PostgreSQL integration, Docker build and Chromium portal browser checks). Tests must prove:
1. No voice entitlement when any enable flag, key or allowlist is missing.
2. Signed-in but non-allowlisted accounts cannot reach the realtime provider or consume a quota.
3. Consent and CSRF are mandatory; arbitrary model/voice override attempts are rejected.
4. Only the private HTML document permits same-origin microphone permission; API/other assets deny it.
5. An approved account can mute, explicitly end, and be forcibly hung up after the session limit, with mock provider/network tests.

Before any limited pilot, manually verify secure HTTPS microphone permission, iOS/Android browser behavior, logout and page-exit cleanup and provider budget enforcement on a **test account**. No live external calls are made by CI.
