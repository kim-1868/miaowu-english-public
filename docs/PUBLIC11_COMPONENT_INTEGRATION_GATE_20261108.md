# PUBLIC-11｜五个公共前端组件的私人集成门禁

> 生效：2026-11-08。**本文件是集成指导与审查清单，不代表私人 V1.1 已集成或已上线。** 公开仓库不应读取私人历史、小说/词库、账户/订单、Cloudflare 密钥和 D1。

## 冻结基线

- 公共 UI 交付：`wordletter-public-ui-8f1cbdf6e55b99bdf30eaf93bbeb1d311da0e2a8`，29 个文件及 SHA-256 manifest，Artifact ID `13581784780`；公共 PR #23、Node、Chromium、main 构建均通过。
- 私人读取基线：V1.1 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`。这只是历史参考，**正式集成时要重取最新私人冻结完整 SHA**，不能使用这份旧快照覆盖继续开发的代码。
- 现有对照：20 个公共文件与私人同 Git blob、4 个有差异（`site-updates.js`、`v11-reader.css`、`v11-responsive.css`、`v11-wordbook.css`）、5 个纯公共新组件尚未接入私人。

## 五个组件对应的旧逻辑拆除表

| 公开 UI 文件与接口 | 待审阅的私人代码位置（仅提示，并非自动修改） | 必须继续私人负责 |
| --- | --- | --- |
| `reader-preferences.js`: `MiaowuReaderPreferences.create(...).mount()` | `app.js` 的 `applyTheme`、`flipTheme`、`applyReadingPrefs`，`toggleNight`、`globalThemeToggle`、`smallerFont`、`biggerFont` 和 `readerFontSlider` 旧监听 | 账号状态、阅读字号从旧存储迁移与覆盖、现有夜读偏好兼容 |
| `shelf-pagination.js`: `MiaowuShelfPagination.create(...).render(...)` | `app.js` 的 `renderShelfPagination` 和翻页回调，先校对分类页码和最新筛选逻辑 | 真实书籍查询、会员分类权益、列表排序与用户状态 |
| `shelf-card.js`: `MiaowuShelfCard.create(...).render(...)` | `app.js` 中 `loadCloudBookCards` 的卡片 DOM（只替换视图，不移出业务查询） | 封面 URL 的合法来源、书籍权限、真实阅读进度及收藏写入 |
| `reader-panels.js`: `MiaowuReaderPanels.create(...).mount()` | `app.js` 的 `mobileChapterOpen/Close`、`readerDrawerOverlay`、`changeGloss`；另外搜索当前分支中其他词汇侧栏监听 | 可见章节与词汇数据、阅读权限、朗读、进度和章节切换 |
| `word-card-view.js`: `MiaowuWordCardView.create(...).show(...)` | `app.js` 的 `showCloudWord`、`closeWord` 内动态 HTML 与重复按钮绑定；避免将私人 `saveCloudWord` 直接移出 | 稳定词义 ID、同义项跨书共享/新义项单独掌握、收藏/已掌握状态、懒加载词库、私人发音回调 |

### 数据和行为合同

1. **仅传入已获服务端授权的数据**。公共 UI 的 `entitled`、`bookmarked`、`mastered`、`hasProgress` 是“显示输入”，绝不构成安全判断。
2. **服务器权威回执**。书架卡片和词卡只回调 `onBookmark/onMastery` 用户意图，发请求、验证权限和持久化只能在私人层；成功才重新传入状态并渲染，失败回滚 UI 提示。
3. **一处绑定**。冻结私人代码后先排查旧 `onclick` 和 `addEventListener`；替换同功能旧控制器后才显式加载对应新组件。禁止把 5 个脚本直接追加到现有 `public/index.html` 并假定旧逻辑自动停用。
4. **进度与词义身份不能被 UI 改写**。学习状态以词义 ID 为单位，同义项跨书不能重复创建词卡，不同义项保留独立学习。翻页、切章节/关词卡不应产生未授权进度写入。
5. **浏览器兼容**。移动端词卡继续非阻塞，不能出现暗色全屏遮罩覆盖正文；目录/词汇抽屉关闭后 `aria-expanded=false` 并能恢复焦点；字号仍维持 12–24px、默认使用私人站现行值。
6. **保留回退**。在私人集成 PR 中记录被替换的具体函数、提交 SHA 和可恢复的上一个候选 SHA。若任何真实权限/阅读/订单异常，恢复私人候选版本，不能靠修改公共 UI 掩盖错误。

## 受控整合的推荐顺序

1. 仅在私人仓库冻结一个候选完整 SHA。读取其最新 `app.js` 与公共交付源 SHA；运行 `node scripts/plan-public-ui-handoff.mjs <public-artifact-dir> <private-checkout-dir> <reviewed-public-full-sha>` 生成只读差异报告（本脚本存公共仓库）。
2. 先单独审阅 4 个同名文件的公共/私人差异，**逐段挑选**可用修改，不覆盖私人正在开发的公告/阅读 CSS。
3. 5 个公共新组件逐个接线，按上表删除旧事件监听或 HTML 生成位置。每个组件在私人候选 PR 单独测试，必须确保私人业务不变。
4. 私人手动固定 SHA Gate 执行真实权限与功能检查；预览测试 D1 上验证注册、登录、兑换、付费墙、书架分页、封面标签、阅读字号/夜读、章节进度、词卡跨书去重、掌握/复习、订单与回滚。验证 Android/iPhone 实机时同时检查词卡不遮挡。
5. 测试通过且用户**明确批准**后才发布正式站。公共 Actions **绝不**持有私人 Secrets、自动触发 Cloudflare 发布，且公共合成测试不可冒充生产验收。

## 版本变动记录规则

每次真实整合须把公共/私人两侧完整 SHA、合并文件、冲突审阅记录、CI URLs、预览验证结果、是否部署及回滚 SHA 写入公共 `docs/UPDATE_LOG.md` 的非敏感部分及私人 `docs/V11_DUAL_REPO_PROGRESS_AND_HANDOFF_20261107.md`。不写入用户、订单、兑换码或其他秘密。

当前完成度：**公共五组件及合成 CI 完成；私人真正接线 0/5，私人正式候选 Gate 尚未实际运行；不会对用户正在开发的站点做自动覆盖。**
