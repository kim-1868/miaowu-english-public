# WordLetter · Public UI Migration Manifest (2026-11-07)

## Verified source and clean migration

- Private reference: `kim-1868/miaowu-english`, development commit `fd885a6ae25f719e5d4ad3fca1cc23dcdd3ada32`.
- Destination: public repository `kim-1868/miaowu-english-public`, own commits. No private Git history imported.
- Real deployment remains in the private repository; this public repo is an **offline component workspace** and does not contain a functioning paid website.
- Explicitly no private backend code, production D1 credentials, actual activation codes, user records, unpublished novel drafts or reference wordlists were copied.

## Public components migrated (12 files)

| Family | Copied paths |
| --- | --- |
| Add to Home Screen | `public/install-guide.js`, `public/install-guide.css` |
| Notices and archive UI | `public/site-updates.js`, `public/site-updates.css` |
| Reader / shelf / word cards | `public/v11-reader.css`, `public/v11-bookshelf.css`, `public/v11-wordbook.css`, `public/v11-responsive.css` |
| Core learning presentation | `public/flashcards.css`, `public/live-reader.css` |
| Onboarding and claim presentation | `public/onboarding.css`, `public/claim.css` |

Public UI sample: `showcase/index.html` plus `showcase/demo-api.js` use **synthetic** notices to exercise real UI scripts, with no actual customer API.

## Public CI ownership

- `.github/workflows/public-guard.yml`: Node 22, no dependencies or deployment tokens; path allowlist, JS syntax, off-line UI behavior tests, whitespace/conflict checks.
- `scripts/audit-public.mjs`: fail-closed tracked-file allowlist; reject known credential patterns, binary files, symbolic links, unexpectedly large files.
- `tests/`: install-guide behavior, notice banner dismissal and latest-ID change, markup-contract and security boundaries.
- `npm run dev` serves only approved public UI assets on `127.0.0.1:4173`; no database connection.
- Standard GitHub-hosted runner on this public repository does not consume the private 2,000-minute monthly allowance, subject to GitHub runner policies.

## Explicitly excluded from public repo

- `content/**`, `db/**`, `deploy/**`, `src/**`, `pages-production/**`.
- `public/ops*`, `public/editor*`, `public/claim.js`, `public/app.js`, `public/flashcards.js`, `public/live-reader.js`, `public/novel-file-parser.js`, `public/design-reference-v03.html`.
- Large image assets or book covers until separate copyright/metadata review.
- Workflows requiring Cloudflare tokens, test/production D1, manual production publish credentials, or private manuscript inputs.

Exclusion does **not** mean these scripts are inherently unsafe; it means they have not been disentangled and security-reviewed for the public repository.

## Integration and spend-reduction protocol

1. Work on allowed new UI modules here first. Run `npm run check && npm test` locally and confirm the public CI run.
2. Freeze the public version for review by full commit SHA; verify changes and do **not** copy Git history.
3. Integrate only approved changes into private production snapshot via a reviewed sync commit; run private backend/integration tests once, not on every experimental public UI edit.
4. Deploy staging on a deliberate reviewed candidate; production requires separate explicit approval.
5. Compare private Actions minutes month-over-month. Existing private runs and unused minutes do not migrate/refund automatically.
6. Keep original private code files in place until exact-version compatibility and smoke tests are complete; never delete an operational path just because a public copy exists.

## Checkpoints

- [x] New public Git history, no private origin mirror.
- [x] 12 production-derived public presentation/interface files copied through reviewed allowlist.
- [x] Synthetic preview + independent JavaScript tests + public CI.
- [ ] Production branch consumes public UI as the authoritative source (awaiting private integration validation).
- [ ] Private PR / staging workflows fully optimized or isolated (see private policy, requires separate safe change).
- [ ] Production deployment switched to approved cross-repository release process.

**Boundary:** Public CI success does not establish that a combined private/public release is ready. The private Worker, D1, entitlement, purchase, and content safety gates remain mandatory.
