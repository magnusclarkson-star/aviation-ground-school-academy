# Aviation Ground School Academy — Secure Student Records Engineering Blueprint

**Status: design only, not deployed.** Updated 7 November 2026. The public GitHub Pages site is an **unaccredited education prototype**. Its self-practice journal and report review workspace are **unsigned and unverified**. No real student accounts, instructor authentication, official training records, flight hours or approved assessments have been implemented.

## Why a separate backend is mandatory

GitHub Pages serves static public files. A JavaScript login form or browser-local journal cannot securely enforce student/instructor roles, protect confidential records, or create an audit trail. Do not add user credentials, private learner records, passwords, payment secrets or regulator materials to the public repository or GitHub Pages. Live authentication and evidence handling require a separate protected application and database under a formally owned deployment.

The interim **Practice Report Review** page is a design test: an educator can import a *user-supplied*, editable report, view its limitations and export a labelled **unverified feedback draft**. It cannot establish who performed the task, who reviewed it or whether the source was manipulated.

## Proposed service boundaries

| Component | Proposed security requirement |
| --- | --- |
| Public academy | Static public lessons, non-credit cockpit, fictional quizzes and instructional materials. Never receives private records |
| Identity service | Verified student and instructor accounts. Production sessions with secure, HttpOnly, SameSite cookies; MFA for staff; email verification and recovery controls |
| Learner record API | HTTPS-only, authorisation at each endpoint using server-side roles, programme enrolment and organisation scope |
| Postgres | Managed encrypted database, limited service credentials, encrypted backups, restricted network access, retained audit events |
| Evidence storage | Private object storage with short-lived access links, malware screening and minimal metadata |
| Instructor review | Authenticated assigned instructors can review evidence and record draft feedback, separately from any authorised official assessment |
| Authority / compliance console | Evidence register tied to actual authorisation documents, effective dates, regulator, authorised courses and verifiable current status. Default **UNAPPROVED** |
| Audit/monitoring | Append-only, access-controlled records of identities, record views, decisions, exports and amendments. Alert on unusual access and failed authentication |

### Proposed roles and least-privilege restrictions

- **Public visitor**: open public education pages only.
- **Student**: access only own enrolments, progress, practice and submitted work. Cannot create official assessments or edit reviewer decisions.
- **Instructor**: access only assigned students and programmes; provide training feedback and assessments *only within an actual authorisation/syllabus scope*.
- **Training manager**: review instructor assignment, moderation, curricula and records; cannot impersonate learners or silently rewrite evidence.
- **Compliance officer**: manage regulatory submissions and verification evidence but cannot automatically mark the academy as approved.
- **Platform administrator**: manage application operations without blanket access to sensitive training evidence.
- **Audit-only reviewer**: time-limited and purpose-specific access to permitted records with every view logged.

No role is authenticated in the current prototype. Visual role labels or local browser state must never be treated as access controls.

## Proposed relational schema (not yet migrated)

| Entity | Representative fields | Important invariant |
| --- | --- | --- |
| `User` | `id`, `emailNormalized`, `role`, `status`, `emailVerifiedAt`, `createdAt` | Unique verified identity; no plaintext passwords |
| `Organisation` | `id`, `legalName`, `country`, `verifiedAuthorityScope` | No cross-organisation data access |
| `InstructorAssignment` | `instructorId`, `studentId`, `programmeId`, `activeFrom`, `activeTo` | Assigned instructor only; no self-granting permissions |
| `CurriculumVersion` | `id`, `revision`, `approvedStatus`, `sourceReferences`, `effectiveAt` | Historical assessments reference immutable curriculum version |
| `Enrolment` | `studentId`, `programmeId`, `scope`, `status` | Eligibility enforced server-side |
| `PracticeAttempt` | `id`, `studentId`, `modelVersion`, `taskVersion`, `telemetryDigest`, `createdAt` | Simulated practice **never** automatically grants aviation credit |
| `EvidenceArtifact` | `id`, `attemptId`, `storageKey`, `sha256`, `type`, `receivedAt` | Private storage, checked content type, size, scanning and retention |
| `FeedbackDraft` | `id`, `attemptId`, `authorId`, `rubricVersion`, `body`, `status` | Revision history; not a sign-off |
| `FormalAssessment` | `id`, `authorisedInstructorId`, `syllabusVersionId`, `scope`, `decision`, `signedAt` | Requires eligibility, authority/school permissions and audited signature |
| `AuditEvent` | `id`, `actorId`, `orgId`, `action`, `entityId`, `occurredAt`, `prevHash` | Append-only chain with separate write permissions |
| `RegulatoryEvidence` | `id`, `authority`, `programmeScope`, `documentHash`, `issuedAt`, `expiresAt` | Approval status set only from checked evidence and authority scope |

A future database schema, migration and authorisation tests must be reviewed before production use. Hashes, history and signatures alone do not replace actual regulatory acceptance.

## Initial API contract ideas (not running)

Use JSON over HTTPS; authenticate and authorise every request, with request identifiers and structured audit logging. Never accept a client-supplied role, grading decision or instructor ID as authoritative.

| Endpoint | Intended role | Checks |
| --- | --- | --- |
| `POST /api/v1/auth/register` | Prospective adult user | Email verification, password policy, rate limit, anti-abuse and consent |
| `GET /api/v1/me` | Signed-in user | Server session; minimal profile |
| `GET /api/v1/programmes/:id` | Permitted user | Effective syllabus/version and enrollment scope |
| `POST /api/v1/practice/attempts` | Student | Ownership, size and schema validation, idempotency, no automatic credit |
| `GET /api/v1/students/me/attempts` | Student | Owner-scoped access, pagination and retention |
| `GET /api/v1/instructors/assigned-attempts` | Instructor | Active course assignment and organisation scope |
| `POST /api/v1/feedback-drafts` | Assigned instructor | Instructor identity from server session, source evidence and audit event |
| `POST /api/v1/formal-assessments` | Specifically authorised instructor | Course-specific authority check, proof review, immutable signed decision |
| `GET /api/v1/compliance/status` | Authorised staff | Full provenance, expiry and country/course restrictions, otherwise no claims |

### Minimum required security acceptance criteria before inviting real learners

1. **Tenant/ownership isolation**: attempts to read or modify another student's or school's records return denial, including guessed IDs and direct-object-reference attacks.
2. **Session security**: robust password hashing (e.g. Argon2id), MFA for privileged staff, login throttling, secure cookies, CSRF defences, logout/revocation and account recovery testing.
3. **Record integrity**: unauthorised grading is impossible; changes create new revisions and audit entries rather than mutating historical evidence.
4. **Storage and privacy**: consent, retention and deletion rules, private attachments and encryption, backed-up data recovery, logging hygiene and breach response.
5. **Training limits**: no training hour/credential can be produced by a mock simulator session. Only accepted evidence and authorised course policy enable official outcomes.
6. **Accessibility and safeguarding**: assistive-technology review, accessible interactions, safe education processes, and special governance before enrolling minors.
7. **Operational readiness**: production secrets outside Git, vulnerability scanning, dependency policy, restore drill, incident response and responsible data governance.
8. **Regulatory truthfulness**: every legal authorisation claim is bounded by verified programme, location, effective period and regulator.

## Iterative implementation plan

- **Phase A — completed:** static self-practice, opt-in local journal, reviewable unsigned JSON and clear unapproved status.
- **Phase B — current design stage:** explicit import/feedback workbench and defined source/provenance limits; stakeholder and instructor testing.
- **Phase C — future:** independent authenticated staging service, managed Postgres, role/assignment tables, signed-in-only learner attempts, tenancy checks and security tests. **Not on GitHub Pages.**
- **Phase D — future:** instructor moderation, revision history, verified assessment lifecycle, curriculum versioning and audit export.
- **Phase E — future:** validation against aircraft-specific AFM/POH and approved course standards; formal programme/qualification evidence and applications through competent organisations/authorities as applicable.

This blueprint is not a statement that the academy qualifies as an approved training organisation, FAA Part 141 school, EASA ATO/DTO or qualified training device. Consult [accreditation readiness](ACCREDITATION-READINESS.md) for research and source references.


## Engineering update — Separate Training API foundation (7 November 2026)

**Implemented as source code, not hosted:** `services/training-api/` contains a standalone Node 22/PostgreSQL 16 API, migrations, CLI-only creation of fictional staging accounts, private login sessions, student-only practice submissions, assigned-instructor-only draft feedback, idempotency and database-scoped access queries.

The initial CI pipeline `.github/workflows/training-api.yml` provisions a disposable PostgreSQL service and verifies migrations, password hashing, opaque cookies, CSRF, session revocation, database-backed sign-in rate limits, student/organisation isolation, revoked instructor assignments, conflict handling and audit events.

**No secure public login is available yet.** The Academy's public GitHub Pages site remains unchanged for authentication, and no student training data has been migrated or hosted. This foundation deliberately requires manual fake-account provisioning; it does not provide verified email, MFA, private dashboard, production retention/security monitoring, tamper-evident audit records or formal assessments. The API writes only a strict allowlist of unsigned synthetic practice data and marks every record unverified.

**Next deployment gate:** a separate restricted staging host, managed private database, reproducible lockfile, least-privilege migration/service DB roles, HTTPS same-origin private frontend, password recovery and staff MFA, and a targeted security/privacy review. For now this is a testing foundation, **not** a service suitable for real students or live enrolment. No regulatory approval is implied.

See [training API setup and limitations](../services/training-api/README.md).
