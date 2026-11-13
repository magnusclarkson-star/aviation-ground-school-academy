# Academy private ATO operations foundation — NOT AN ACCREDITED SCHOOL

This is a standalone, private-server component of the public [Aviation Ground School Academy](../README.md). It is **not deployed** on GitHub Pages. Its role is to establish controlled identities, internal training records and regulator-evidence gates without claiming that the Academy holds a Sierra Leone Civil Aviation Authority (SLCAA) approval.

## What is implemented

- Invite-only adult student/staff accounts; no unrestricted signup or youth accounts.
- Passwords hashed with per-user salt using scrypt; opaque 256-bit cookie sessions hashed before database storage, HTTP-only, SameSite Strict, Secure on HTTPS, with 8-hour expiry and logout revocation.
- Role authorisation for accountable manager, head of training, quality manager, instructor, examiner and student.
- Manual submission and **independent internal QA review** of authority-issued documentary references and SHA-256 hashes.
- Distinct ATO certificate, training specifications, training/procedures manual and safety-management acceptance evidence gates. Course approval and examining authority are further independent gates.
- Draft curriculum registration, required training stages, adult-only enrolments, staff-recorded stage records, authorised examiner evidence, independent quality countersignature and database-only approved-course-completion record. **No pilot licence or regulator certificate is generated.**
- Append-only training/exam rows and audit history, with triggers preventing modification of protected records. API does not expose DELETE on training records.
- Same-origin private portal and student access to their own enrolment, assessment and course-completion records.
- Separate public API status that does **not** claim ATO accreditation, even if documents have been entered or internally attested.

## Regulatory source and status

SLCAA SLCAR Part 1B (Feb 2024), sections 2.3.1–2.3.14 and 3.2.2, including course approvals, personnel, QA, SMS, approved simulation devices and record retention:
https://slcaa.gov.sl/wp-content/uploads/2024/05/PART-1B-APPROVED-TRAINING-ORGANIZATION-5-FEB-24.pdf

SLCAA Part 1A (June 2025), personnel licensing and training requirements:
https://slcaa.gov.sl/wp-content/uploads/2025/09/UPDATED-SLCAR-PART-1A.pdf

SLCAA AC-PEL048 ATO certification process (July 2021; confirm current acceptable guidance with SLCAA):
https://slcaa.gov.sl/wp-content/uploads/2024/01/SLCAA-AC-PEL048-Rev-00-CERTIFICATION-OF-AN-APPROVED-TRAINING-ORGANISATION-31-JULY-2021.pdf

**Human sign-off is mandatory:** An evidence SHA-256 is not a certificate authenticity check. A verified record means an authorised internal quality reviewer claims to have checked external documents and scope. Software cannot independently query SLCAA's current certificate registry, issue examining privileges or approve a school. Any official training claim requires direct confirmation of the certificate and training specifications.

## Run in an isolated secure environment (not on GitHub Pages)

1. Use a dedicated PostgreSQL 16+ instance on private networking and a separately hosted Node.js 22+ environment behind an HTTPS reverse proxy. Create migration owner and restricted application database users. Configure verified remote database TLS, encrypted managed backups, security monitoring and a suitable secret manager.
2. Install exact declared dependencies: `cd academy-secure && npm install` (generate, review and commit a lockfile before production deployment). Do not put secrets in the repository.
3. Using a migration-capable connection: `psql "$DATABASE_URL" -f schema.sql`. Restrict the running application user to necessary DML; do not make it a schema owner, superuser or a role allowed to disable triggers.
4. Set `ACADEMY_ORIGIN` to the exact external HTTPS origin and `DATABASE_URL` to the private PostgreSQL DSN using `sslmode=verify-full`. The service binds localhost by default; use a properly configured TLS terminator to route access.
5. For the **first** accountable manager only, supply `ACADEMY_ENABLE_BOOTSTRAP=true`, `ACADEMY_BOOTSTRAP_EMAIL` and `ACADEMY_BOOTSTRAP_PASSWORD` from a secret manager to `npm run bootstrap`. The script rejects additional bootstrap accounts. Immediately remove bootstrap settings, rotate exposed secrets and enable supported MFA through an identity provider before a public launch.
6. Start with `npm start` and open the privately hosted root URL. Invite adult instructors/students, separately verify staff credentials and external approvals. SLCAA's actual authorisation must be obtained outside this software.
7. Run `npm test`; the GitHub Actions ATO workflow also uses an isolated test PostgreSQL instance.

## Security and operational gaps blocking production

- No identity-provider integration, MFA, secure email invitations, guardian authorisation or school-based age/identity verification. Adult checkbox is self-attested and NOT acceptable for younger learners or secure KYC.
- No secure encrypted evidence vault/file upload, digital signatures, regulator API linkage, trust-service verification, offsite backups verification, privacy notices or privacy/data-access workflows.
- No online proctoring, secure private item-bank management, exam scheduling/identity checks, question randomisation safeguards or independent examiner accreditation. Assessment endpoint is an **evidence-recording tool** for existing independently conducted exams, not an official online exam service.
- The 'ISSUED' database record is a **course completion record** contingent on staff-entered external evidence, not a pilot licence, regulator-issued training authorisation or digitally signed PDF.
- Real source/edition review and authorised instructors must sign the Training and Procedures Manual and the course-level syllabus before any claims of credit. Public browser quiz scores cannot migrate into regulated records automatically.
- Infrastructure security assessment, backup/restore exercise, access-review procedure, incident response, disaster recovery, penetration testing and data-retention policies require qualified implementation and approval.
- Keep student/staff records at least the retention period specified in Part 1B 2.3.12 (published minimum two years after student completion and after instructor/examiner separation), subject to applicable legal obligations and any longer retention requirements. Seek professional advice before automated deletion.
- The intended SLCAA application is a **separate legal/organisational process** with facilities, staff, fees, certification and course-specific ratings. See [certification dossier](../docs/SLCAA-ATO-CERTIFICATION-DOSSIER.md).

This component deliberately fails closed and cannot be considered a production accredited training platform until these independent requirements are met.


## Private administrator signature capture (new, not yet deployed)

The signed-in **accountable manager** can use the private portal's **My electronic signature and certificate seal** panel to:

- Sign directly in the large white pad using a finger, stylus or mouse, or load a PNG/JPEG of *their own* existing signature; the portal converts it to a bounded PNG on the device.
- Independently tick intended use categories: formal course certificates, Scouts/Air Scouts achievements, enthusiast certificates, academic transcripts, and the optional Academy seal.
- Re-enter their current account password and explicitly confirm ownership before upload. Password confirmation is rate-limited and never saved by the browser application.
- Save or replace the signature image, view a private preview, change the checkbox preferences independently, and remove the encrypted active image. Removal retains only audit metadata, not signature pixels, in the active database.
- Keep unsigned documents unsigned by default. Saving and ticking a preference **never signs a document automatically**, grants a qualification, bypasses a fee or substitutes for academic/regulatory release authorisation.

**Encryption:** The private server encrypts PNG bytes before PostgreSQL storage using AES-256-GCM, a fresh 96-bit nonce and authenticated associated data bound to the account UUID. A SHA-256 fingerprint is recorded for integrity. The ciphertext is not stored in the public GitHub repository; only the owner role can retrieve a preview. The API sends `Cache-Control: no-store` and the browser revokes the private image preview when signing out.

**Required host configuration:** Supply `ACADEMY_SIGNATURE_ENCRYPTION_KEY` from a suitable secret manager as a freshly generated, dedicated, random **32-byte key encoded as base64**. For example, generate a local key with `openssl rand -base64 32` on a trusted workstation, then store the result in the hosting platform secret manager; **do not commit the value** to files or send it to the chat. Do not re-use database passwords or JWT keys. The API refuses to save signatures without a valid configured key. Safeguard encryption-key backup and recovery: losing the key makes stored signatures unreadable; rotating it requires a planned encrypted migration. Keep the private database, backups, HTTPS credentials and access logs secured.

**Privacy:** Do not upload scanned signatures of others. Store only the administrator's actual voluntarily supplied signature. Use of a signature on a formal document must require a separate, auditable document release, a verified existing course-completion record and correct authorisation; the checkboxes configure only the *possible* categories. An original Academy seal is not an SLCAA official stamp, and signing an Academy record does not establish accreditation.

**Important deployment limitation:** The repository contains the private server and signature-capture UI, but this service is **not hosted on public GitHub Pages** and the owner has **not yet supplied a signature**. Until the private server and PostgreSQL database are deployed with the encryption secret, no signature can be stored in the live Academy admin panel. Test with `node --test tests/signature-vault.test.mjs` plus the PostgreSQL integration suite before production work.
