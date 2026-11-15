# Free-first development and launch-cost approval standard

**Owner rule — applies to Aviation Ground School Academy and is intended as the default for the owner's other present and future apps.**

The normal path is **build, test, improve and publish approved free previews first; incur paid hosting, database, third-party API, subscription, or payment costs only when the project approaches a verified launch and the owner has explicitly approved the specific expense**.

## Working standard

1. **Default to zero incremental cost.** Use GitHub branches, reviews, free CI, local/synthetic test fixtures and existing free static preview infrastructure. Reuse free resources only where data separation, security and service quotas permit; never assume a free service lasts indefinitely.
2. **No implied spending approval.** Creating a cloud resource, upgrading a plan, enabling billable usage, turning on a payment provider, or migrating to a chargeable platform requires a separate, explicit owner authorization **after** communicating provider, resource, estimated recurring and one-off costs, billing start, cancellation implications and the impact on existing projects. Providing payment card information or saying "continue" is not itself permission to create or upgrade paid infrastructure.
3. **Plan safely without applying.** It is permitted to save and validate deployment templates and review non-billable proposed plans, but do **not** approve a paid infrastructure sync or create a paid resource while this free-development policy is in force. Leave auto-sync/auto-deploy disabled for paid staging unless specifically authorised.
4. **Keep app boundaries strict.** Repositories, payment environments, databases, encryption keys, user records and service identities must not be mixed between applications. Never disrupt a working app to advance another.
5. **Protect accepted work.** Preserve designs, approved aircraft models, simulator layouts, visual artwork and completed workflows. Make changes in narrowly scoped branches; verify in CI; inspect regressions before merge or public preview deployment. Do not claim a change is complete until checks confirm it.
6. **Remain in test mode.** Use mocked/sandbox payments, synthetic student and transaction data, and demonstration credentials as appropriate. Do not treat mock ledger transactions as real settlement, or public demo completion as official training accreditation.
7. **Explicit launch checkpoint.** Before changing to paid/live operation, present a concise launch-readiness checklist covering cost and budget cap, security and privacy, backup/recovery, payment/KYC or regulatory approval as applicable, user testing, production monitoring and rollback. Activate only the individual resources and real-money features approved by the owner.
8. **Proactive budget review.** Warn about expirations and unavoidable costs early, but do not purchase an upgrade without authorization. Where possible, offer a lower-cost safe alternative and state its limitations.

## Project-specific restrictions

- Keep the public static Academy on GitHub Pages during development; use free GitHub Actions checks and synthetic PostgreSQL in CI.
- The optional Render Blueprint under `infra/render-private-staging.yaml` is **planning only** until the owner separately approves paid service creation. Its estimated $13/month is not automatically approved by this document.
- Do not activate the private student portal, real student records, regulated certificates, or payment acceptance during unpaid development. Keep the approved Cessna, R44, fighters, cockpit layouts, original artwork, and certificate designs unchanged except for requested, tested revisions.

## Status

This is a **development governance policy**, not a billing-control feature or a guarantee against charges on existing services. It makes no Render API changes, turns on no paid services and does not replace billing alerts or provider spending limits. Review this standard before proposing any new app hosting.

**Current owner direction:** Continue development free until close to launching. No paid Academy hosting plan has been approved for deployment.
