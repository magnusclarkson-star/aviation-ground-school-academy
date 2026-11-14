# Private Academy hosting preflight — 14 November 2026

**Current state:** GitHub Pages hosts the public Academy lessons and simulator. The private student records, finance, signature and certificate service **has not been deployed**. Do not use the public Salone One service or its database for Academy learner records. This document is a deployment preparation checklist, not evidence of operational approval or a live launch.

## Security boundary and recommended order

1. **Start with an isolated, non-public environment.** Create a separate private PostgreSQL instance, a Node.js 22+ service and an HTTPS ingress protected by an independently configured access gateway with MFA. Keep the service inaccessible to anonymous public users while it is being configured. For Render, a private service has no public browser address; a public web service is inappropriate until gateway protection, staff MFA, student privacy safeguards and release testing have been established.
2. **Create restricted DB roles.** Apply `academy-secure/schema.sql` using a migration-only role, not the runtime account. Configure the application account with only the necessary table permissions. Verify that audit, training, assessment and financial attestation immutability triggers cannot be bypassed by the runtime account.
3. **Pin the deployment dependencies.** The private package currently declares exact `pg` and `pdf-lib` versions but does not have a committed `academy-secure/package-lock.json`. Generate a reviewed lockfile in an isolated environment with `npm install --package-lock-only --ignore-scripts`; commit it and use `npm ci --ignore-scripts` before real deployment. Until then, the build is **not reproducible enough for production acceptance**. Do not install dependencies or write secrets in the public GitHub Pages artifact.
4. **Install production secrets only in the private host secret manager.** Required values include `NODE_ENV=production`, a precise `ACADEMY_ORIGIN=https://<actual-private-access-origin>`, `DATABASE_URL=postgresql://...?...sslmode=verify-full`, and the separate 32-byte base64 `ACADEMY_SIGNATURE_ENCRYPTION_KEY`. The launch preflight rejects placeholder origins, invalid encryption keys, database connections without strict verified TLS, and any active account bootstrap flag in the running production process. Never commit or paste credentials into the repository or a chat.
5. **Bind correctly for the selected host.** By default the service listens only on `127.0.0.1`. Render uses its inbound proxy, so set `HOST=0.0.0.0` and use its assigned `PORT` for any Render service. This is a socket reachability requirement, not a substitute for a network access policy. Set `ACADEMY_ACCESS_STATE=closed` throughout staging.
6. **Bootstrap once while isolated.** Run `npm run bootstrap` with temporary bootstrap credentials from a secret manager in a controlled operator environment. Remove bootstrap env vars immediately; `ACADEMY_ENABLE_BOOTSTRAP=true` is refused by the production HTTP service. Rotate setup credentials and require externally enforced MFA before real administrative use. Adult students remain invite-only. Youth/Scout accounts remain disabled pending safeguarding and consent governance.
7. **Protect the certificate masters and administrator signature.** Preserve the three accepted Academy certificate designs. Provision verified private master artwork to a private volume using `provision-master-artwork.mjs`, verify exact fingerprints, and test encrypted backup and recovery. The SHA-256 fingerprints do not make an image or signature publicly private if past public Git history contains copies.
8. **Verify the closed-state health checks.** `GET /api/health` returns liveness for the server process. `GET /api/ready` returns `503` while `ACADEMY_ACCESS_STATE=closed`. The portal, login and protected APIs also return `503`. This prevents a port-ready process from being mistaken for a launch-ready service.
9. **Test the restricted state behind the independent access gateway.** Only after external security approval, temporarily set `ACADEMY_ACCESS_STATE=restricted` in an isolated staging environment. `GET /api/ready` returns `200` **only when a PostgreSQL query succeeds**. Test role boundaries, MFA, backup recovery, staff onboarding, privacy workflows, certificate fee gates and log redaction. This environment variable is an explicit operator switch; **it does not itself enforce MFA or verify a gateway**.
10. **Keep payments and formal qualification claims off.** The existing API allows an administrator to attest an *externally* settled payment. It does not collect money, contact a payment provider or prove settlement. No live payment provider is connected. No public practice quiz is a regulated exam, no online course completion creates a pilot licence, and SLCAA approvals remain independent documentary and organisational steps.

## Minimal operational checks (after isolated deployment)

Commands below are templates to run within a trusted network with a valid HTTPS origin. They are **not** a claim that such a host currently exists:

```sh
# Expected while closed:
curl -i https://records.your-domain.example/api/health  # 200: process only
curl -i https://records.your-domain.example/api/ready   # 503: CLOSED
curl -i https://records.your-domain.example/            # 503: CLOSED

# After access gateway and MFA verification, deliberately set
# ACADEMY_ACCESS_STATE=restricted on the private service:
curl -i https://records.your-domain.example/api/ready   # 200 only if DB works
curl -i https://records.your-domain.example/api/me      # 401 without session
```

Confirm `Cache-Control: no-store` on protected responses, HTTPS from the caller's browser, no sensitive tokens in logs and signed-off role-specific access. Do not expose the database connection string or passwords during diagnostics.

## Open blockers before actual student launch

- Private hosting and PostgreSQL with verified TLS have not been provisioned or tested.
- No externally integrated MFA, secure invitation delivery, student identity/age/guardian processes, data subject rights or assessed production privacy controls.
- The production runtime has no committed lockfile, reviewed DB role separation or independently verified backup/restore procedure.
- No connected live payment processor; the administrator manual settlement function is not bank verification.
- Official Academy credential issuance still depends on private master artwork, protected owner-signature use, student identity checks, academic authorisation, independent fee release and manual regulatory reviews.
- The public site must not be mistaken for the private student portal. A GitHub Actions check or GitHub Pages deployment proves code publication/tests, not private-server deployment.

References: [Render web service binding](https://render.com/docs/web-services), [Render private vs public services](https://render.com/docs/web-services), [Render Blueprint configuration](https://render.com/docs/blueprint-spec).
