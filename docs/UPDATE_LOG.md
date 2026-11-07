# WordLetter｜公共开发更新日志

> 本文件从 2026-11-07 起作为公共仓库的**持续交付记录**。每次功能变动（包括代码、测试、文档规范）都需要在合并前填写一条记录，并在合并后补上 PR、最终 SHA 与 Actions 结果。只记录公开信息，私人业务发布与数据库变更留私人仓库专门的交接记录。

## 更新记录

### 2026-11-07 · PUBLIC-07｜小说标注结构的公开合成测试（PR 待验收）

- **位置**：公共独立分支 `feature/public07-synthetic-annotation-guard-20261107`，不触碰私人开发分支。
- **改动**：新增 `scripts/annotation-contract.mjs`、`tests/annotation-contract.test.mjs`；扩展 `scripts/audit-public.mjs` 的精确白名单、`package.json` 的 JS 语法检查。
- **内容**：用虚构样本验证跨章节重复 ID、未知词卡引用、空白文本、空释义、混合片段，并提供标注数量/实际使用 ID 的统计；不包含真实小说、词库、源站 API 或生产凭据。
- **本地验证**：同等脚本的 6 个 Node 单元测试通过；公共 GitHub Actions 结果在 PR 创建后确认。**这只验证格式引用，不验证词义自然或可上架**。
- **生产影响**：无。没有修改正式/预览站、D1、用户学习记录及付费系统；未自动合并或部署。


### 2026-11-07 · PUBLIC-06｜公开前端构建/交付迁移（进行中）

- **目标**：公共 Actions 构建独立、可复核的前端更新包，私人仓库只进行最终敏感集成和受控发布。
- **改动**：新增 `scripts/build-public-ui.mjs` 和 `tests/public-bundle.test.mjs`、更新 `package.json`、安全白名单、`.gitignore`、公共工作流与 README；仅选择 18 个经安全审查的 JS/CSS/SVG 文件。
- **构建交付**：生成 `dist-public-ui/manifest.json`，逐文件 SHA-256，记录公共代码完整提交；公共 `main` 检查通过后保留 14 天 Actions artifact；不自动部署、不联系私人仓库。
- **验证与版本**：待公共 PR 和 main CI 验收后补全；无私人业务改动。


### 2026-11-07 · PUBLIC-05｜公共仓库 CI 重复触发优化

- **位置**：公共仓库 [Issue #7](https://github.com/kim-1868/miaowu-english-public/issues/7)，独立开发分支 `feature/public05-ci-trigger-dedupe-20261107`。
- **更改**：公共 `.github/workflows/public-guard.yml` 将 push 检查限定为 `main`，feature 分支默认只在创建/更新 PR 时运行，并提供 `workflow_dispatch` 手工检查入口。过时任务仍自动取消；继续使用只读权限、Node 22、白名单、离线检查，无生产部署。
- **测试**：新增 `tests/workflow-triggers.test.mjs` 校验触发条件、只读权限、取消过时任务和离线安全门禁；文件清单与公共更新日志同步维护。
- **私人影响**：无；私人 GitHub Actions 2,000 分钟上限**不会**因本优化消失。本修改仅降低公共仓库重复检查和等待。
- **合并**：[PR #8](https://github.com/kim-1868/miaowu-english-public/pull/8) 已 Squash 合并到公共 `main`，提交 `2656e0acdbcb77ab3c329b5776f81a72c2553c3a`。
- **验证**：PR Actions [42382432358](https://github.com/kim-1868/miaowu-english-public/actions/runs/42382432358) 成功；合并后 `main` Actions [42382464164](https://github.com/kim-1868/miaowu-english-public/actions/runs/42382464164) 也成功。检查 feature 分支新提交没有额外触发 push 检查，仅在 PR 创建时运行。没有发布真实网站。


### 2026-11-07 · PUBLIC-03｜跨设备书架、阅读、词卡样式与测试

- **位置**：公共开发分支 `feature/public03-responsive-reader-wordcard-20261107`，关联 [Issue #3](https://github.com/kim-1868/miaowu-english-public/issues/3)。
- **修改**：`public/v11-responsive.css`、`public/v11-reader.css`、`public/v11-wordbook.css`；`showcase/reading-shelf.css`；新增 `showcase/responsive-contract.html/css/js`、`tests/responsive-layout.test.mjs`；同步 `showcase/index.html`、`scripts/audit-public.mjs`、`package.json` 与项目文档。
- **内容**：320–430px 窄屏布局与换行保护、44px 移动触控区域、阅读字号滑块更合理伸缩、夜读标签及词卡按钮的文本对比、合成数据下的真实 CSS 选择器交互演示；不改阅读字号的存储逻辑，也不改掌握状态。
- **验证**：分支 `e31ba67c54e060336d6295032b7d773e56e1a4fe` 的公共 Actions [42381994899](https://github.com/kim-1868/miaowu-english-public/actions/runs/42381994899) 通过。测试检查 CSS 结构、常用手机断点、夜读颜色对比、12–24px 演示字号与合成页面隔离。**属于结构/自动检查，非真实浏览器截图验收。**
- **私人影响**：无部署、无 D1、无正式站/预览站更改；`v11-*.css` 三个公共文件与原私人基线已产生差异，后续必须对照私人最新提交逐项合并，不得整文件覆盖。
- **合并**：[PR #6](https://github.com/kim-1868/miaowu-english-public/pull/6) 已 Squash 合并到公共 `main`，准确提交为 `82facd627376b2dbb81cfa109375a5bfb2adcdd7`。
- **最终验证**：PR Actions [42382144682](https://github.com/kim-1868/miaowu-english-public/actions/runs/42382144682) 通过，公共分支代码检查通过；未触发任何正式/预览部署。
- **状态**：公共组件优化已完成并合并，Issue #3 继续开放，等待真实浏览器视觉/触控验收与私人业务整合。


### 2026-11-07 · PUBLIC-02｜公告展示与历史记录健壮性

- **位置**：公共仓库；开发分支 `feature/public02-announcement-qa-20261107`。
- **范围**：`public/site-updates.js`、`tests/announcement-regression.test.mjs`、`scripts/audit-public.mjs`、项目更新文档。
- **修正**：忽略过时的公告请求响应；紧凑历史列表去重；历史公告标签支持方向键与 Home/End 导航；历史独立页面加载失败后显示可重试按钮并在成功后恢复。
- **测试**：增加最新公告关闭与重新发布、历史加载/重试、同页去重、纯文本渲染、键盘访问与旧请求覆盖的自动回归；分支提交 `2a1c61d6a2a2e82b855a568cbe4c9126ec8ce8b6` 的公共 Actions 已通过。
- **私人侧**：未改动私人分支、运营台、真实公告接口及 D1；此优化只存在公共版本，待私人端最终整合审查。
- **合并**：[PR #5](https://github.com/kim-1868/miaowu-english-public/pull/5) 已 Squash 合并到公共 `main`，提交 `e582a234a3eeb8fab850b5a859c22b748c3b0e1c`。
- **验证**：PR Actions [42381193701](https://github.com/kim-1868/miaowu-english-public/actions/runs/42381193701) 与推送检查均成功；没有正式站或测试站部署。
- **跟进**：浏览器真实视觉/无障碍检查、与最新私人公告脚本的文件差异比对。

### 2026-11-07 · PUBLIC-01｜合成书架与日夜阅读展示

- **位置**：公共仓库。
- **代码**：`showcase/reading-shelf.html`、`showcase/reading-shelf.css`、`showcase/index.html`、`tests/public-ui.test.mjs`、`scripts/audit-public.mjs`。
- **效果**：新增三本纯虚构书架卡片、日间/夜间阅读和合成词卡展示，用于公共前端隔离验收。
- **PR**：[公共展示 #4](https://github.com/kim-1868/miaowu-english-public/pull/4) 已合并，提交 `5919925e95bddc2ded6a4aaa2a02fd4b5675770c`。
- **验证**：公共 CI 通过；尚缺真实设备视觉验收，Issue #1 保持开放。
- **生产影响**：无；网站仍以私人仓库受控发布为准。

### 2026-11-07 · 双仓库安全拆分

- **内容**：建立公共研发与私人核心分界线，从私人 V1.1 参考提交逐文件审查并以干净提交历史迁入 18 个公共 CSS/JS/SVG 文件。
- **验证**：迁移时与私人参考分支的 18 个对应文件 Git blob SHA 完全一致；公共 CI、独立合成演示已正常执行。
- **发布影响**：原私人线上部署、数据库、会员权益和内容资产不变。

## 后续每次更新必须填写的交付项

每次 PR 或开发交付必须包括：**日期及任务号**、修改文件、功能变化、公共提交 SHA、公开测试/Actions 结果、与私人仓库的版本差异、是否部署、遗留问题及下次任务。涉及私人数据或核心业务时不要在公共日志描述具体秘密；对应内部记录写入私人仓库 `docs/V11_DUAL_REPO_PROGRESS_AND_HANDOFF_20261107.md`。

**版本安全规则**：公共仓库的更新不会自动覆盖私人网站。私人站如果同时修改了同一文件，应先比较两边最新 SHA、逐项合并，再由私人环境验证；未经审阅，不允许直接替换。
