# Academy certificate-master protection: deployment readiness

**Scope:** the owner's *three existing approved original artworks*. This process does not redesign, resave or replace them. The public gallery uses its own permanently watermarked raster sample previews. The watermark is **never** added to a genuinely issued Academy document.

## Current security boundary

- **Public GitHub Pages:** publishes the three 1491 × 1055 raster previews with SAMPLE / NOT ISSUED burned into the pixels. It does not publish the clean original image segments, and the deployment now verifies that the clean paths return 404/410. Printing from the public gallery is restricted.
- **Private Academy document server:** verifies the original SHA-256 hash before using an exact original for an authorised student's certificate, after academic and financial release checks. When `NODE_ENV=production`, a missing private master is **not** replaced with a public-source copy. The issued certificate remains unavailable until the exact original has been installed privately.
- **Private owner sources:** existing administrator-installed master PNGs in PostgreSQL are accepted if they match the exact approved fingerprints. Alternatively, set `ACADEMY_CERTIFICATE_MASTER_DIR` to an absolute, non-public directory whose three PNGs match the approved fingerprints. The app verifies each file at read time and refuses symlinks.

## One-time operator installation on a trusted private host

Do not ask students to upload a master, and do not place master PNGs in any GitHub Pages folder, public bucket or publicly accessible path.

1. Create a private hosting environment for the Academy Node service and PostgreSQL (with HTTPS and restricted database privileges). This is separate from GitHub Pages.
2. While the original artwork source is still available in a trusted working tree, execute **one time only** on the secure server:
   ```sh
   node academy-secure/provision-master-artwork.mjs /var/lib/agsa/certificate-masters
   ```
   The command accepts only an absolute path outside the Academy source checkout; writes all three files with restrictive permissions; validates exact SHA-256 fingerprints; and refuses to overwrite a different or damaged file.
3. Mount/persist that directory **only in the private Academy service**, not the public website. Configure `ACADEMY_CERTIFICATE_MASTER_DIR=/var/lib/agsa/certificate-masters` and `NODE_ENV=production` using the private host's configuration manager.
4. Confirm the signed-in owner certificate-master status reports all three ready. Exercise the **private** formal, Air Scouts and enthusiast certificate test previews and genuine student release gates. Do not put learner details or actual owner signatures in public preview images.
5. Make encrypted backups of the private database and original masters, and test a recovery. Do not delete the clean originals until a validated private backup and recovery process exists.

## Remaining GitHub exposure: a separate issue

**The original master segments are still in the public repository's working tree and older Git commits.** Protecting GitHub Pages does *not* hide these historical Git objects, forks, prior downloads, caches or archived releases. Private server storage does not reverse prior disclosure. This is a real, outstanding limitation; screenshot deterrence does not prevent copying the artwork.

Before removing these originals from the current public repository, establish a separate **private** source of truth and private backup that keeps certificate issuance working. Then cut over production to private masters, remove the source segments from the public tree, and consider a coordinated repository history clean-up using GitHub's sensitive-data-removal guidance. That last step cannot revoke copies people already downloaded, and rewriting published Git history can disrupt collaborators, pull requests, branches and deploys. Do **not** force-rewrite history or delete current master sources merely to hide them while they are the only source for authorised future certificate generation.

If exclusivity of the artwork is essential despite historical disclosure, only newly approved replacement artwork could materially change what future copies expose. **No replacement is authorised here.**

## Operational hold points

The Academy's separate private document server has not been verified as deployed to a production host. Public Pages deployment and automated tests cannot be treated as proof of actual, live regulated student issuance. Keep full certificate issuance behind the staff-attested completion, regulator-evidence and course-approval, owner signature authorisation, and administrator-controlled fee/waiver checks.

Never store hosting credentials, database connection strings, owner's handwritten signature or real learner evidence in a public GitHub file or this document.
