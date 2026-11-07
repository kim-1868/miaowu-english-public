# WordLetter · Public UI Migration Manifest (2026-11-07)

## Verified source and clean migration

- Private reference: `kim-1868/miaowu-english`, development commit `fd885a6ae25f719e5d4ad3fca1cc23dcdd3ada32`.
- Destination: public repository `kim-1868/miaowu-english-public`, own commits. No private Git history imported.
- Real deployment remains in the private repository; this public repo is an **offline component workspace** and does not contain a functioning paid website.
- Explicitly no private backend code, production D1 credentials, actual activation codes, user records, unpublished novel drafts or reference wordlists were copied.

## Public components migrated (24 files)

| Family | Copied paths |
| --- | --- |
| Add to Home Screen | `public/install-guide.js`, `public/install-guide.css` |
| Notices and archive UI | `public/site-updates.js`, `public/site-updates.css` |
| Reader / shelf / word cards | `public/v11-reader.css`, `public/v11-bookshelf.css`, `public/v11-wordbook.css`, `public/v11-responsive.css` |
| Core learning presentation | `public/flashcards.css`, `public/live-reader.css` |
| Onboarding and claim presentation | `public/onboarding.css`, `public/claim.css` |
| Base design styles | `public/styles.css` |
| Public customer-facing pages | `public/index.html`, `public/updates.html` |
| Learning UI client modules | `public/flashcards.js`, `public/chapter-words.js`, `public/echo-cloud.js`, `public/onboarding.js` |
| Book/category illustrations | `public/cat-bookmark-clip.svg`, `public/shelf-cet4.svg`, `public/shelf-cet6.svg`, `public/shelf-ielts.svg`, `public/shelf-postgrad.svg` |

Public UI sample: `showcase/index.html` plus `showcase/demo-api.js` use **synthetic** notices to exercise real UI scripts, with no actual customer API.

## Public CI ownership

- `.github/workflows/public-guard.yml`: Node 22, no dependencies or deployment tokens; path allowlist, JS syntax, off-line UI behavior tests, whitespace/conflict checks.
- `scripts/audit-public.mjs`: fail-closed tracked-file allowlist; reject known credential patterns, binary files, symbolic links, unexpectedly large files.
- `tests/`: install-guide behavior, notice banner dismissal and latest-ID change, markup-contract and security boundaries.
- `npm run dev` serves only approved public UI assets on `127.0.0.1:4173`; no database connection.
- Standard GitHub-hosted runner on this public repository does not consume the private 2,000-minute monthly allowance, subject to GitHub runner policies.

## Explicitly excluded from public repo

- `content/**`, `db/**`, `deploy/**`, `src/**`, `pages-production/**`.
- `public/ops*`, `public/editor*`, `public/claim.js`, `public/app.js`, `public/live-reader.js`, `public/novel-file-parser.js`, `public/design-reference-v03.html`.
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
- [x] 24 production-derived public presentation/interface files copied through reviewed allowlist.
- [x] Synthetic preview + independent JavaScript tests + public CI.
- [ ] Production branch consumes public UI as the authoritative source (awaiting private integration validation).
- [ ] Private PR / staging workflows fully optimized or isolated (see private policy, requires separate safe change).
- [ ] Production deployment switched to approved cross-repository release process.

**Boundary:** Public CI success does not establish that a combined private/public release is ready. The private Worker, D1, entitlement, purchase, and content safety gates remain mandatory.

## PUBLIC-10 additional clean snapshot (2026-11-07)

- Six new public-facing UI files taken from private V1.1 commit `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`. Source Git blobs were checked before copying; no private git history was imported.
- These files are public UI **source snapshots**, not a functioning production deployment. In particular, public `index.html` refers to private `/app.js`, user/account D1 authorization and protected APIs, which remain owned by the private repository. Public `onboarding.js` and review UI only invoke server-side authorization; permission decisions are not migrated.
- Public delivery manifest grows from 18 to 24 exact allowlisted files. Private app/UI releases must compare complete source SHA and file hashes before staged integration, never silently replace concurrent edits.

**PUBLIC-10 实际核验记录**：公开 PR #17 合并 SHA `0105b212b226a9898e7696cd314b999785826278`；24 文件公共 Actions Artifact 已核实（ID 13579168592）；对应私人 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4` 中 20 文件 Git blob 一致，4 文件有公共优化的预期差异，零缺失。公共页面仍依赖私人后端及 `app.js`，不可独立上线。完整公共/私人开发分界参见 [公共前端所有权](PUBLIC_FRONTEND_OWNERSHIP_20261107.md)。


## PUBLIC-11：新创建的可复用公共展示模块

- `public/reader-preferences.js`：从私人 UI 源逻辑中独立实现阅读字号/夜间切换（已通过公共 Chromium）；对应 PR #19，源参考 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`。
- `public/shelf-pagination.js`：从私人书架分页视图中抽出纯 DOM/UI 与事件回调，**不包含任何实际数据查询、用户权限判断或上传**；对应 PUBLIC-11-02。二者都是**公共新组件**，并不是已接入私人运行网站；私人原 `app.js` 仍为生产真实功能入口。


**PUBLIC-11-02 核验里程碑**：现在的公共交付包包含 26 个文件，其中最初迁入的 24 个文件单独在前文列出，新增 2 个公开纯 UI 组件为 `reader-preferences.js` 与 `shelf-pagination.js`；[PR #20](https://github.com/kim-1868/miaowu-english-public/pull/20) 合并提交 `bc3de0fe82c275204d26c5a2ffa1f4800e7ac6a3`，公共浏览器测试及主分支构建全部通过，Artifact ID `13580371015`。私人参考 26 文件对照结果：20 相同、4 个已知差异、2 个公共新增文件待集成，不应把此结果误读为私人代码缺少应上线的核心功能。


## PUBLIC-11-03 新增书架卡片展示模块（2026-11-08）

- `public/shelf-card.js` 为**在公共仓库独立重构的前端展示组件**（来源仅为私人 V1.1 `app.js` 对客户可见布局的审阅），不是从私人仓库迁移完整 `app.js`。
- 只允许注入合成书籍或私人前端已经得到授权/筛选的数据；不负责核验 `entitled`、`hasProgress`、`bookmarked` 等值，更不向 D1 写入。
- 对应公开合成演示、Node 注入过滤/按钮回调测试和 Chromium 手机/电脑测试。所有 27 个文件通过公共构建后再交付私人候选整合阶段，未经签核不会自动部署。
