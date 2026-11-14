# Academy private Render staging — owner-controlled deployment plan

**Status: deployment template only; not live.** The public Aviation Ground School Academy remains on GitHub Pages. This template prepares an entirely separate, private, billable staging environment; it does not provide a browser-accessible student portal, verified tuition payments, accreditation or actual enrolment. Do not connect this private system to Salone One's database.

## What the template declares

The optional file `infra/render-private-staging.yaml` defines two new resources in Render's Frankfurt region:

- `agsa-private-records-staging`: **private service (`pserv`)**, Docker, paid `0.5c-512mb` plan, manual deployment only, **no public URL** and `ACADEMY_ACCESS_STATE=closed`.
- `agsa-private-postgres-staging`: dedicated PostgreSQL 16, paid `0.5c-1g` plan, external IP allowlist **empty**.

Both are separate from the existing Salone One deployment. They do not get created by a GitHub merge. Render Blueprints support a custom YAML path; creation and each manual sync must be authorised by the workspace owner. The template does not invoke `fromDatabase` for the application because that would inject the default schema-owner credential rather than the separately restricted runtime database login.

**Cost alert:** both resources use paid plans. The owner must review Render's current pricing and explicitly authorise billing before provisioning them. Keep Render Blueprint auto-sync and service auto-deploy disabled; do not create preview environments.

## One-time staging setup — operator steps

1. Sign in to the authorised Render workspace. Review account plan and payment method. Connect the existing GitHub repository `magnusclarkson-star/aviation-ground-school-academy` and create a Blueprint using the **custom path** `infra/render-private-staging.yaml`. Inspect the two resources, confirm their names, region, paid plans, `pserv` and `ipAllowList: []`. Do not approve resource creation before you understand charges. Configure **Manual Sync**.
2. For the first private launch you need access to the dedicated staging PostgreSQL instance through a trusted operator path. Using migration-owner credentials kept only in the secret manager, apply `academy-secure/schema.sql` and then `academy-secure/runtime-privileges.sql` as the database administrator. Create a separate **nonowner** login, grant it the `agsa_app_runtime` NOLOGIN role and confirm that it cannot alter any table schema, audit history, examination or recorded settlement. SQL files are not bundled inside the public Pages website or the runtime Docker image; run them only from a controlled migration environment.
3. Supply these four secrets and configuration entries to the **private** service through Render's encrypted service configuration: `DATABASE_URL`, `ACADEMY_ORIGIN`, `ACADEMY_SIGNATURE_ENCRYPTION_KEY`, and `ACADEMY_TOTP_ENCRYPTION_KEY`. Never paste these in ChatGPT, GitHub issues, CI logs, or public files. Make the encryption keys **different** 32-byte cryptographically random values encoded as canonical base64, and back them up in a separate secure vault. If either key is lost, its previously encrypted signature or MFA material may be unrecoverable.
4. Set `DATABASE_URL` to the **restricted runtime login's** Render **internal hostname** (a single-label `dpg-...-a` host) with the query suffix `?sslmode=require&uselibpqcompat=true`. Percent-encode credentials correctly. `ACADEMY_DB_NETWORK=render-private` and Render's own `RENDER=true` are mandatory for this exception; non-Render or public-host database URLs remain locked to `sslmode=verify-full`.
5. Set `ACADEMY_ORIGIN` to the **actual planned HTTPS browser-facing gateway origin**, with no path or trailing slash. This private service has no public address and the Blueprint provides no gateway. If the external gateway domain is not yet chosen, do not promote or publish the private portal. The configuration must refer to an actual operator-owned origin before turning `ACADEMY_ACCESS_STATE` to `restricted`.
6. Bootstrap the first accountable-manager account **once in a controlled, private operator environment** with the dedicated bootstrap action. Never use a public bootstrap endpoint, persist bootstrap secrets, or enable `ACADEMY_ENABLE_BOOTSTRAP=true` for the production HTTP server. All staff require the new authenticator MFA setup; independently review invitation delivery, access gateway, phishing-resistant MFA options and account recovery before anyone uses real accounts.
7. After creating the Blueprint and configuring the private connection, perform a manual service deployment. While `ACADEMY_ACCESS_STATE=closed`, a private-network GET to `/api/health` returns process liveness, and `/api/ready`, login and portal pages return 503. **Render private services have no public URL**, and their TCP health check does not validate database readiness. A successful Render deployment is not a student launch.
8. Only after the independent HTTPS gateway, staff identity controls, data privacy review, backups, signing-master storage and audit monitoring are in place should staging be temporarily switched to `restricted` for supervised testing. Check `/api/ready` with the restricted runtime login, test cross-role access, MFA, fee waivers, document release, and fresh encryption-key recovery. Never activate live tuition processing until provider compliance and bank settlement verification are complete.

## Important Render PostgreSQL TLS distinction

Render documentation states that same-region **internal** PostgreSQL connections use a private network and may use self-signed TLS. They **cannot** verify the CA or hostname with `sslmode=verify-ca` or `verify-full`. To require encrypted TLS despite the self-signed certificate, Render documents `sslmode=require`. The Academy's preflight only accepts this weaker identity-verification posture when all of the following hold: Render production, `ACADEMY_DB_NETWORK=render-private`, a single-label `dpg-...-a` internal hostname, `sslmode=require` and `uselibpqcompat=true`. The latter makes the pinned Node PostgreSQL client correctly handle Render's self-signed TLS.

**Trade-off:** internal TLS encrypts the connection but does not cryptographically validate the server's identity. Private-network isolation, a no-public-access database, dedicated credentials and least-privilege SQL role are therefore essential. Any other production database, including a public Render PostgreSQL hostname, still requires `sslmode=verify-full` and correctly trusted certificate authority.

## Outstanding launch blockers

- No Render hosting resources have yet been created or billed; the Blueprint is optional and manual.
- No real account, HTTPS gateway or public student portal has been provisioned; staff cannot reach a private service directly through a phone browser.
- No real restricted database user or schema has been provisioned in Render.
- No secure backup, off-site recovery test, external MFA/access gateway or approved privacy policy has been operationally checked.
- Neither official aviation accreditation nor online tuition/payment provider verification is implemented.

References: [Render Blueprint format](https://render.com/docs/blueprint-spec), [private service networking](https://render.com/docs/private-services), [Render Postgres TLS rules](https://render.com/docs/postgresql-creating-connecting), [Node PostgreSQL SSL parsing](https://www.npmjs.com/package/pg-connection-string).
