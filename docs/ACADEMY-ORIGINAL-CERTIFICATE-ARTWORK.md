# Original Academy certificate designs — controlled master-artwork register
**Status: implemented upload and print integration; original PNGs not included in the public GitHub repository.**

On 13 November 2026 the administrator selected the **original** high-resolution certificate artworks shown in the Academy project discussion. Earlier Academy source used simplified CSS and vector approximations; these are **not accepted substitutes**. This change keeps the three original images unchanged and provides administrator-only upload and checksum verification.

| Academy audience | Exactly approved original file | SHA-256 |
| --- | --- | --- |
| Formal courses | `formal-traditional-burgundy.png` (aircraft accident investigation burgundy/ivory) | `6050a0603674d7b5e402c0c21b477ef76b04b107e6abc61c13a314978d5f7986` |
| Scouts / Air Scouts | `scouts-modern-aviation.png` (teal/silver aviation runway) | `e5a3fe35698e9637a37ffb24218ee1fbf79074e0232d0e93199eca7ccf8d98c9` |
| Enthusiasts | `enthusiast-navy-gold.png` (navy/gold avionics instruments) | `03de002823c75cbe8f7a93ad756bd7361f51f51287f4f8ecb1ccc93c5d4e8be1` |

All original files measure **1491 × 1055 PNG pixels**. The hashes pin the **exact bytes**, not only visual similarity. The build deliberately does **not** embed the artwork in publicly accessible source files or create alternate recreated artwork.

## Administrator installation

1. Obtain the original master PNG files from the Academy's preserved artwork pack. Do not resave as a screenshot or edit and re-export them; that would change the expected checksum.
2. Deploy the private Node + PostgreSQL Academy service with proper HTTPS, authenticated accountable-manager credentials, a restricted database role, encryption and security monitoring. This is not a GitHub Pages feature.
3. Apply `academy-secure/schema.sql` using the migration account; production migrations must be reconciled with existing tables, not blindly replayed over live records.
4. In the owner dashboard select **Install the three original approved certificate images** and upload each master into its corresponding box. The server verifies the PNG signature, exact dimensions and SHA-256.
5. Refresh status: **all three** must show installed. Certificate previews and formal issuance refuse to silently fall back to generic redraws if a selected master is missing or wrong.
6. Use the standard owner-controlled design choices, signature-vault preferences, financial entitlement/waiver, independent academic identity review and approved course record checks before releasing private PDFs.

The public gallery can preview these exact masters locally via browser file selection and checksum check; images remain in the browser's IndexedDB rather than being transmitted or included in web source. The private owner upload is required for **server-generated** PDFs.

## Important design constraint

The original artwork contains **fixed lettering and a decorative central medallion**. Some wording (course titles, completion prose, signatory roles) is part of the original pixels. During PDF production the original PNG is placed on the entire page unchanged. Only the preprinted course title *inside the ribbon* is masked and replaced with the actual approved course title; the learner name, issue date, certificate reference and authorised optional signature are overprinted into reserved fields.

The existing illustrated central seal and printed instructor/signatory lines cannot be toggled off without changing the selected source artwork. The seal checkbox refers to an **additional Academy mark**. The instructor-line box cannot erase lines printed in the original. This limitation must remain visible to the owner.

The source pictures use course-completion terminology and may contain phrases like *approved course*. The private document process **must not** treat such artwork as evidence of SLCAA permission. Only actual SLCAA authorisations, authenticated staff review, valid completion records and fee/waiver release gates permit a formal document. **No issued PDF is a pilot licence or a regulator certificate.**

### Future professional production step

For full flexibility while retaining the selected illustrated borders, commission approved *text-free master variants* from the original artist or source artwork. That would allow changing course wording, signatory labels, existing medals and disclaimers without covering pixels. Such variants must be separately reviewed and approved by the administrator; they must never silently overwrite these three original approved files.
