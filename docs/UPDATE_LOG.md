# WordLetter｜公共开发更新日志

> 本文件从 2026-11-07 起作为公共仓库的**持续交付记录**。每次功能变动（包括代码、测试、文档规范）都需要在合并前填写一条记录，并在合并后补上 PR、最终 SHA 与 Actions 结果。只记录公开信息，私人业务发布与数据库变更留私人仓库专门的交接记录。

## 更新记录

### 2026-11-09 · PUBLIC-PACKAGE-PREFLIGHT｜上传前 JSON 结构与旧 ID 对照

- 新增纯离线 `scripts/inspect-novel-package.mjs` 与合成测试，报告章节/词卡/标注、必填字段、长段无英文、原书 ID/章节 ID/同义项词卡 ID 漂移及上传上限。
- 已审阅会话文件《月光便利店的最后一单》新版：8 章、140 卡、236 标注、72 段；字段空缺与找不到词卡的引用均为零；但未能对比原版生产历史。
- 程序不读取 Cloudflare/D1、不上传真实小说、不绕过私有运营权限。生产修复候选仍在私人 PR #203，正式站未部署。


### 2026-11-09 · PUBLIC-409｜旧书上传入口自动识别合成回归

- 公共仓库新增 `scripts/novel-upload-route-contract.mjs` 和 11 条 `tests/novel-upload-route-contract.test.mjs`，模拟旧书版本化修订、首次确认和历史下架二次确认、同名不同 ID 阻断及不误调用新书创建。
- 不迁移私人 OPS 真实业务处理、数据库、密钥或三本小说内容；配套 `docs/PUBLIC_409_ROUTING_QA_20261109.md` 说明私有生产验收门禁。
- 真正的 409 服务端修复仍在私人 PR #203，尚未部署正式网站。公共合成回归通过仅意味着行为契约验证，不代表正式环境完成。


### 2026-11-09 · PUBLIC-NOVEL-REVISION｜已下架小说更新的公共合成回归（PR 待验收）

- 将下一阶段**可公开部分**的小说修订安全回归放入公共仓库：纯数据模型验证旧书/章节 ID、已发布后下架状态、历史词卡不可变、旧版备份、额外确认与绝不自动上架。
- 新增 `scripts/novel-revision-contract.mjs`、`tests/novel-revision-contract.test.mjs`；调整公共白名单与 `npm run check`。已存在的公共 Actions 将运行 `npm test`，后续不必为纯契约改动启动私有 Actions。
- 不迁移真实三本小说、可售 JSON/封面、云端密钥、运营台后端、D1、生产发布工作流或私有 Git 历史。私有 PR #203 仍为待验收/未部署状态；生产 D1 只读预检与账户账单问题仍要独立解决。
- PR、最终 SHA 和公共 Actions 结论待填写，见 `PUBLIC_NOVEL_REVISION_HANDOFF_20261109.md`。


### 2026-11-08 · PUBLIC-SF-W32｜小说工厂稳定增量补丁公共合成守卫（候选）

- 补充完全虚构的词卡 ID → 英文词形/中文释义稳定映射测试，阻止同 ID 被偷偷改成新义项；重复出现同义项不算新增词卡。
- 私人 W3.2 只修正本机 UI / 提示信息 / 章节密度与修订守卫；独立支持从 V2 或 W3.1 升级、源文件哈希预检、自动备份、失败回滚、不覆盖旧书与新章。
- 公共仓库没有真实书稿、考试词库、任何 CLI 模型调用、私密文件/令牌、D1 或 V1.1 部署。合成测试不代表真人浏览器或私有业务验收通过。
- **公开 CI 已完成**：[PR #33](https://github.com/kim-1868/miaowu-english-public/pull/33) 通过 [公共 Actions #42455084214](https://github.com/kim-1868/miaowu-english-public/actions/runs/42455084214) 后合并，Squash commit `db5b17fe1f23c43d41ce0d08c1380fd27646f63f`；私人 Actions 0。真实 W3.2 补丁仅在私人 Library，用户 Mac 尚待安装验收。


### 2026-11-08 · PUBLIC-SF-W31｜章节审核与定向修订公共安全契约（候选）

- 公开层新增 P1/P2 审核隔离状态、旧稿不可变校验、候选原稿 SHA 检查、真人确认与执行时并发阻断的虚构回归；完成密度审核不等于教学终审或出版授权。
- 真实章节文本、模型输出、私人本机修订程序及用户记录仍在私人侧，公共测试绝不调用 AI，也不触碰 V1.1 正式/预览。
- 待公共 Actions 验证通过后合并，不能将纯合成通过冒充真实浏览器或 AI 测试。


### 2026-11-08 · PUBLIC-SF-W3｜多模型连续章节合成安全契约

- 新增 `scripts/story-provider-contract.mjs` 与公共测试：Codex/Claude/Gemini 三个确定适配器、已保存章节连续性、跨模型单章已尝试阻断、1–8章及1–20分钟预算上限和不可发布状态。
- 严格使用匿名虚构章节序号，没有真实小说、词库、模型凭证、访问令牌、CLI 调用、D1 或出版操作。
- 与私人 `w3_provider_scheduler.py` 的职责分离：公共回归只验证通用约束；私人本机引擎负责真正 CLI 调用及语义审核；不触及已冻结的 V1.1 网站。
- **公共验证完成**：[PR #31](https://github.com/kim-1868/miaowu-english-public/pull/31) 已 Squash 合并，提交 `f5955563fc7eb1a9920b8c36d15435d47e3d07b9`；[公共 Actions #42403534197](https://github.com/kim-1868/miaowu-english-public/actions/runs/42403534197) 通过。无需私人 Actions。私人真实 Codex/Claude/Gemini 兼容性与故事内容审校不在公共测试范围内。


### 2026-11-08 · PUBLIC-DEV-CORE-WAVE1｜3 个纯逻辑组件迁入公共开发测试（完成）

- 从私人 V1.1 固定提交仅审阅并逐文件复制 `public/novel-file-parser.js`、`src/editorial-code-switch-lint.js`、`src/spaced-review.js`；代码 Git blob 与私人一致，不携带其 Git 历史。
- `tests/public-dev-core-wave1.test.mjs` 以虚构小说、合成单词验证 parser/候选标签、中文夹英文词性风险、跨日复习 1/3/7/14/30 天与同日不重复延后；静态保证无数据库/API/Secrets。
- 扩增公共审计白名单/语法检查/Node 测试；**29 个公共 UI 交付包保持不变**。公共 Build 仍只公开已审的 UI 文件，不额外包含商业词库/真实小说。
- 具体来源和安全边界：`docs/PUBLIC_DEV_CORE_WAVE1_20261108.md`。不合并或修改私人活动分支、不改 D1/Cloudflare、尚未上线新算法。
- **本批已正式合并公共仓库**：[PR #30](https://github.com/kim-1868/miaowu-english-public/pull/30) Squash 合并提交 `9b1157f5e2ab7b8bdbaff72f6c6e796416bfb686`；[PR Node CI #42401829724](https://github.com/kim-1868/miaowu-english-public/actions/runs/42401829724)、[PR Chromium #42401829635](https://github.com/kim-1868/miaowu-english-public/actions/runs/42401829635)、[主分支 CI #42401931687](https://github.com/kim-1868/miaowu-english-public/actions/runs/42401931687) 全部成功。逐文件核对源 Git blob 与私人固定 SHA 完全一致。29 文件公共 UI Release 白名单**不变**，主分支 Artifact `wordletter-public-ui-9b1157f5e2ab7b8bdbaff72f6c6e796416bfb686`（ID `13585926397`）。
- **未完成事项**：更大的公共纯逻辑迁移仍需逐文件审查；本批没有执行私人业务验收、没有替换私人书架/复习/出版运行代码、没有发布新的 GitHub Release、更没有部署预览或正式站。


### 2026-11-08 · PUBLIC-SF-W1｜小说工厂工作台 W1 公共合成演示（候选）

- **实际代码**：独立 `showcase/story-workbench.html/.css/.mjs` 工作台页面与不依赖后端的内存状态机；创建批次、按章进度模拟、暂停/失败恢复、审核门禁、只可导出带 `notForPublication` 的纯合成状态摘要。
- **隔离**：不迁移三本旧稿/六本新书正文、私有词库、用户/订单、D1、模型凭据和私人 Git 历史；本页面没有真实 AI 自动生成或出版能力。
- **自动检查**：扩展公开白名单、Node 状态机测试与 Chromium 多尺寸交互脚本。工作台文件**不加入正式网站 29 文件生产构建白名单**，避免修改已冻结的 V1.1 预览站。
- **已完成**：[PR #29](https://github.com/kim-1868/miaowu-english-public/pull/29) 已 Squash 合并至公共 `main`（提交 `c931fc6cfe316e3c790bc6a379f5756a1e372cab`）。[公共 Node/白名单 CI #42401313269](https://github.com/kim-1868/miaowu-english-public/actions/runs/42401313269) 和 [公共 Chromium CI #42401313275](https://github.com/kim-1868/miaowu-english-public/actions/runs/42401313275) 均通过（包含 320/390/1440px 的 W1 创建、暂停、模拟失败恢复、审核与导出）。合成测试全部在公共仓库，不涉及私人 Actions。W2 真实引擎接入、W3 连续8章 AI 生产仍未完成，未部署网站。


### 2026-11-08 · PUBLIC-BUILD-01｜公共完整 Build / SHA-256 复验与审核后 Release（已合并）

- 公共 Actions 继续承担前端代码白名单审计、合成 Node 测试、29 文件 UI 构建及 Chromium 浏览器测试；公共 main 在上传短期 Actions Artifact 前新增完整 SHA/文件安全独立核验。
- 新增 scripts/verify-public-ui-release.mjs 和 tests/public-release-bundle.test.mjs：拒绝改动文件、额外文件、符号链接、错误源 SHA、伪造 manifest 等。
- 新增仅 workflow_dispatch 手动触发的 .github/workflows/public-ui-release.yml：必须明确确认且输入完整审核过的 main SHA，重新测试后用独立的公共 contents: write job 创建 ZIP + manifest + SHA256SUMS Release。PR、push 绝不自动创建 Release。
- 不把私人仓库源码、小说、词库、用户/订单、数据库、Cloudflare 私钥交给公共运行器；私人完整业务测试和真正部署仍在私人。**尚未实际创建 Release / 未部署网站。**
- 执行与安全边界见 docs/PUBLIC_BUILD_RELEASE_HANDOFF_20261108.md。
- **验收完成**：[公共 PR #27](https://github.com/kim-1868/miaowu-english-public/pull/27) 已 Squash 合并，核心提交 `bd3391e78f1b93664a87a7eae740a29b2617eb5f`。[PR Actions #42399785161](https://github.com/kim-1868/miaowu-english-public/actions/runs/42399785161) 和 [main Actions #42399902636](https://github.com/kim-1868/miaowu-english-public/actions/runs/42399902636) 均成功；main 的 29 文件构建与二次校验已通过，并上传 Artifact `wordletter-public-ui-bd3391e78f1b93664a87a7eae740a29b2617eb5f`（ID `13584619130`）。公开 Release 工作流**已安装但未手动触发**；GitHub Releases 仍为空，不可称已发布 Release。无需私人 Actions、未部署。


### 2026-11-08 · PUBLIC-SF-01｜小说工厂批次合成合同测试（候选）

- **归属**：新增 `scripts/story-batch-contract.mjs` 与 `tests/story-batch-contract.test.mjs`，全部为虚构样本；扩充公共文件白名单、语法检查与边界政策文档。用于新词预留、跨等级隔离、重复章号、词卡引用和密度的离线回归，降低私人重复测试频率。
- **未迁移**：任何真实书稿、考试候选词库、词卡审校表、用户订单与权限、D1 或生产凭据；没有修改私人业务代码、正式或预览站。
- **验收**：[公共 PR #25](https://github.com/kim-1868/miaowu-english-public/pull/25) 已 Squash 合并，提交 `eadad2bb58ce56f11a4cb22eecb443d71b856e76`；[公共 Actions #42398587885](https://github.com/kim-1868/miaowu-english-public/actions/runs/42398587885) 成功：`npm run check`、94/94 Node 测试、公共交付构建、路径白名单检查通过。首轮 CI 发现测试断言错把“单本完成数”当“全批次完成数”，修正后重新运行通过。整个过程**未触发私人仓库 Actions**。
- **说明**：公共合成测试不等于小说自然度、词卡 IPA 或实际数据库权限验收；本 PR 未改网站生产代码或部署。


### 2026-11-08 · PUBLIC-11-07｜公共分页组件首次进入私人隔离接线候选（离线验证成功）

- **候选代码已建立，尚未合并上线**：私人 [Draft PR #190](https://github.com/kim-1868/miaowu-english/pull/190)，基于私人 V1.1 固定 SHA `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`，候选提交 `1e98a8ce9a1ae50bb1fe7a92ebddd5abbb2cb928`；没有修改活动分支。
- **复用实际公共文件**：`public/shelf-pagination.js` 与公共源 Git blob `be3864615c09a8475d5e4a15845e4fb26b0b48eb` 完全相同。私人 `app.js` 在公共组件可用时只调用其 DOM 渲染，旧分页器仍是脚本缺失时的**互斥回退**；分类筛选、页码状态、书籍 API、滚动和用户权益全部保留私人。
- **生产资产安全预检**：候选 `index.html` 在原 `app.js` 之前加载公共脚本，生产资产允许列表纳入 `shelf-pagination.js`；新增私人离线集成回归测试及限定分支、无密钥、无 D1 的简短 CI。
- **离线验证已完成**：[私人候选 GitHub Actions #42396232279](https://github.com/kim-1868/miaowu-english/actions/runs/42396232279) 成功，包含 `node --check`、分页回调/公共与旧版互斥测试、生产静态资产本地构建。此项为必要的**一次小型私人候选测试**，而非日常 UI 反复运行；公共组件研发和 Chromium 仍全在公共。
- **仍未完成**：私人全套测试/候选 Gate、带测试 D1 的登录/权益/分页验证、真实设备验收，以及私人候选合并与发布。全局计数：**5/5 公共组件已完成，1/5 已形成私人隔离接线候选，0/5 合并活动开发分支**。正式上线前仍须取得用户批准。没有预览/正式部署或数据库修改。


### 2026-11-08 · PUBLIC-11-06｜五个公共 UI 组件的私人安全整合门禁（已完成）

- **目标**：防止公开 UI 直接叠加旧私人 `app.js` 导致重复监听、词卡状态乐观覆盖、权限错误或线上进度丢失。
- **变更**：新增 `docs/PUBLIC11_COMPONENT_INTEGRATION_GATE_20261108.md` 明确五组件各自接口、私人旧函数审阅点、授权/收藏/词义 ID 数据边界、冻结 SHA、逐项替换、私人 Gate、备份与回退。
- **公共自动验证**：新增 `tests/public11-integration-boundary.test.mjs` 核对 5 组件已审核白名单、只显式导出 `create()`、无私有网络调用，且公共首页并未自动装载新控制器；不涉及私人仓库运行器。
- **交付范围**：本轮只加公共开发/测试文档与安全合同；29 个公共 UI 交付文件数量不变、私人原站无更改。关联 [PUBLIC-11 Issue #18](https://github.com/kim-1868/miaowu-english-public/issues/18)。
- **最终结果**：[PR #24](https://github.com/kim-1868/miaowu-english-public/pull/24) 已 Squash 合并至公共 `main`，提交 `3cf89c44188c8f4a2a5717b70f3a4ed5d628ab48`。[PR Node 安全/防双重绑定检查 42393623856](https://github.com/kim-1868/miaowu-english-public/actions/runs/42393623856) 与 [合并后公共 main 检查 42393655589](https://github.com/kim-1868/miaowu-english-public/actions/runs/42393655589) 均通过。
- **新的可验证交付快照**：`wordletter-public-ui-3cf89c44188c8f4a2a5717b70f3a4ed5d628ab48`，29 个文件及 SHA-256 manifest（Artifact ID `13582676147`）。本 PR 没有改变这 29 个前端文件，仅增加公共 CI 集成安全合同和交接文档。与私人 V1.1 仍是 20 一致、4 旧差异、5 公共新组件待整合。**私人真正接线仍是 0/5，正式/预览站未部署。**


### 2026-11-08 · PUBLIC-11-05｜非阻塞词卡展示和学习按钮合同（已合并）

- **来源与范围**：只审阅私人 V1.1 固定 SHA `0cf00b37ffa029997436fa3c0b2c67e35b114aa4` 的 `app.js` 词卡纯展示合同，**没有复制词义数据、书籍内容、完整词卡缓存、会员/用户/订单/D1 或保存状态的接口**。
- **公开交付**：新增 `public/word-card-view.js`（`MiaowuWordCardView.create(...).show(...)`）、`showcase/word-card-contract.html/css/js`（三个虚构词汇），使用 DOM 和 textContent 渲染音标、词义、例句、常用搭配、词序、收藏和已掌握按钮。用户只能发送保存或掌握的意图，**结果以私有端确认为准**。
- **安全/可用性**：移动底部词卡保持非阻塞、无全屏遮罩，可切换其他词，恶意 HTML 文本安全显示；加载/缺失时禁用学习状态操作，关闭后清空高亮；合成 Node 测试和 Chromium 320/390/1440px 回归。
- **交付包**：公共白名单及 SHA-256 manifest 从 28 增至 29 文件，合成测试与只读差异预检同步调整；**不自动集成到私人 app.js、不触及 Cloudflare 或 D1**。关联 [PUBLIC-11 Issue #18](https://github.com/kim-1868/miaowu-english-public/issues/18)。
- **最终验收**：[PR #23](https://github.com/kim-1868/miaowu-english-public/pull/23) Squash 合并到公共 `main`，提交 `8f1cbdf6e55b99bdf30eaf93bbeb1d311da0e2a8`。[Node 安全和行为测试 42393095483](https://github.com/kim-1868/miaowu-english-public/actions/runs/42393095483)、[Chromium 手机/桌面真实交互 42393095543](https://github.com/kim-1868/miaowu-english-public/actions/runs/42393095543)、[合并后 main 构建 42393184164](https://github.com/kim-1868/miaowu-english-public/actions/runs/42393184164) 均通过。
- **交付产物与分支差异**：已核实 29 文件 SHA-256 Artifact `wordletter-public-ui-8f1cbdf6e55b99bdf30eaf93bbeb1d311da0e2a8`（ID `13581784780`）；对照私人 V1.1 提交 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`：20 相同 Blob、4 个既有公共差异（公告 JS、阅读/响应式/词本 CSS）、5 个新公共组件待整合。私人运行站/D1/预览/生产均未更改。


### 2026-11-08 · PUBLIC-11-04｜阅读目录/词汇抽屉与释义按钮展示层（已合并）

- **源逻辑**：私人 V1.1 `public/app.js` (参考提交 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`) 的移动目录抽屉、词汇面板、`toggleGloss/sideToggleGloss`；不再重复之前抽离的日夜主题/阅读字号。
- **公共交付**：新建 `public/reader-panels.js`，处理抽屉互斥开闭、遮罩点击、Esc、焦点与 `aria-expanded`；释义显示/隐藏仅修改 CSS class 并可通过注入回调给私人 UI 提示。新建 `showcase/reader-panels-contract.html/css/js` 合成阅读工具栏演示。
- **自动测试**：`tests/public-reader-panels.test.mjs` 覆盖关闭状态同步、键盘焦点、重复绑定、无网络/业务状态；公共 Chromium 在 320/390/1440px 检查真实点击和横向溢出，交付包 27→28 个精确白名单文件。
- **边界**：该模块**未安装到私人站点**；私人章节权限、朗读、章节词汇获取、学习进度/D1 及运营均不迁入公共。未来需审阅最新 `app.js` 后移除旧重复监听再私有整合。
- **最终版本**：[公共 PR #22](https://github.com/kim-1868/miaowu-english-public/pull/22) 已 Squash 合并，提交 `9db45dba7b072f716992eb0fdba2e0517886ec86`。Node [42391549720](https://github.com/kim-1868/miaowu-english-public/actions/runs/42391549720)、Chromium [42391549751](https://github.com/kim-1868/miaowu-english-public/actions/runs/42391549751)、合并后 `main` [42391644048](https://github.com/kim-1868/miaowu-english-public/actions/runs/42391644048) 全部成功。第一次浏览器用例因桌面关闭按钮按设计隐藏而失败，已修正桌面通过工具栏按钮关闭的测试路径；没有为通过测试而改网站正常响应式行为。
- **交付文件**：`wordletter-public-ui-9db45dba7b072f716992eb0fdba2e0517886ec86`，SHA-256 Manifest + 28 个精确白名单文件（Artifact ID `13581776893`）。对照私人开发提交 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`，20 个同 Blob、4 个原有差异、4 个公共新组件仍待私有整合。没有部署预览站或正式站。


### 2026-11-08 · PUBLIC-11-03｜书架卡片纯展示组件（已完成）

- **来源**：审阅私人 V1.1 提交 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4` 中的 `public/app.js` 书架卡片展示区域（不迁移 `loadCloudBookCards` 中的接口查询、授权或状态持久化）。
- **新增**：公共 `public/shelf-card.js`，使用 `document.createElement` 和 `textContent` 创建书籍封面、合法标签、会员显示文案、进度占位和收藏/阅读按钮，回调完全由私有业务方注入。非法封面 URL、标签颜色过滤；收藏不进行乐观写入。
- **验证**：新增 `tests/public-shelf-card.test.mjs` 覆盖 HTML 注入、非法封面、回调/收藏状态、权益显示、长度边界；`showcase/shelf-card-contract.html/css/js` 为虚构书籍；公共 Chromium 增加 320/390/1440px 真实交互检查。
- **交付包**：精确白名单 26→27 个文件，继续采用 SHA-256 和只读差异预检；**不触碰私人运行站、D1 或 Cloudflare，不导入真实书籍数据**。对应 PUBLIC-11 [Issue #18](https://github.com/kim-1868/miaowu-english-public/issues/18)。
- **最终验收**：[公共 PR #21](https://github.com/kim-1868/miaowu-english-public/pull/21) 已 Squash 合并到公共 `main`，提交 `d8ea09f154d5e3a35787267ae886b1dd066a2eb3`。修复旧 26 文件断言后 [Node 功能及安全检查 42390538871](https://github.com/kim-1868/miaowu-english-public/actions/runs/42390538871)、[真实 Chromium 合成 UI 验收 42390538839](https://github.com/kim-1868/miaowu-english-public/actions/runs/42390538839)、[合并后主分支构建 42390644374](https://github.com/kim-1868/miaowu-english-public/actions/runs/42390644374) 全部通过。
- **版本与边界**：27 文件交付包 `wordletter-public-ui-d8ea09f154d5e3a35787267ae886b1dd066a2eb3`（Artifact ID `13580754886`）；对照私人 V1.1 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`，20 个 SHA 相同、4 个公共版本有差异、3 个新增公共组件尚未安装。**私人正常开发与预览/正式发布没有改变。**


### 2026-11-07 · PUBLIC-11-02｜从私人 app.js 拆分纯 DOM 书架分页组件（已合并）

- **源逻辑**：私人 V1.1 `public/app.js` `renderShelfPagination`，参考固定 SHA `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`；只移出分页渲染，不移出书籍查询、用户书架、权限或数据库。
- **公共新文件**：`public/shelf-pagination.js`、`showcase/shelf-pagination-contract.html/css/js`、`tests/public-shelf-pagination.test.mjs`。`MiaowuShelfPagination.create({document}).render({container,meta,currentPage,onPageChange})` 提供只读视图，回调由私人集成方负责，不访问网络。
- **验收计划**：Node 合成 DOM/页码边界/重复渲染/回调与无权限检查；公共 Chromium 320/390/1440px 真实点击。公共交付包 25→26 文件并同步 SHA-256/只读差异预检。
- **私人影响**：原 `app.js` 仍原样工作，无线上或预览部署；以后整合前必须删除原分页函数并按最新私人代码测试真实书架和分类切换，不能重复渲染。
- **验收结果**：[公共 PR #20](https://github.com/kim-1868/miaowu-english-public/pull/20) 已 Squash 合并到公共 `main`，提交 `bc3de0fe82c275204d26c5a2ffa1f4800e7ac6a3`。公开 [Node/安全测试 42387700757](https://github.com/kim-1868/miaowu-english-public/actions/runs/42387700757)、[Chromium 手机与桌面浏览器 42387700804](https://github.com/kim-1868/miaowu-english-public/actions/runs/42387700804) 和 [合并后构建 42387778840](https://github.com/kim-1868/miaowu-english-public/actions/runs/42387778840) 均成功。
- **交付包**：`wordletter-public-ui-bc3de0fe82c275204d26c5a2ffa1f4800e7ac6a3`（Artifact ID `13580371015`），26 个白名单文件及 SHA-256 清单。对照私人 V1.1 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`，20 个文件 SHA 一致、4 个仍需审查、2 个为新组件且私人当前无同名文件，绝未自动覆盖或上线。


### 2026-11-07 · PUBLIC-11-01｜从私人 app.js 拆分公开阅读控制组件（已合并）

- **源逻辑**：私人 V1.1 `public/app.js`，参考 SHA `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`。仅提取全站夜间切换与阅读字体/标题缩放逻辑，不复制小说、用户、订单、权限或学习持久化内容。
- **新公共组件**：`public/reader-preferences.js`，只在调用 `create().mount()` 时注册事件；默认 18px、最小 12px、最大 24px，保留原 UI 元素 ID、本地显示偏好键名、字号按钮禁用和全站夜读标签。
- **测试**：`tests/public-reader-controls.test.mjs` 新增单元/DOM 合同；`showcase/reader-controls-contract.html/css/js` 使用纯合成文字；公共 Chromium 新增 320/390/1440px 交互检查。公共交付白名单 24→25 文件，更新完整哈希构建与只读差异预检测试。
- **私人影响**：私人 `app.js` **完全没有改**，该组件未接入正式/预览站；仍需在后续冻结候选时先移除原控制监听，再做一次性整合验证，不能简单追加两份逻辑。关联 [PUBLIC-11 Issue #18](https://github.com/kim-1868/miaowu-english-public/issues/18) 与 [PR #19](https://github.com/kim-1868/miaowu-english-public/pull/19)，已 Squash 合并至公共 `main`，提交 `627326c6ad63807d69840b58ced5a9000d14812a`。公共 [Node 安全与 DOM 测试 #42387193020](https://github.com/kim-1868/miaowu-english-public/actions/runs/42387193020)、[Chromium 手机/电脑浏览器 #42387193140](https://github.com/kim-1868/miaowu-english-public/actions/runs/42387193140) 和 [合并后主分支检查 #42387278052](https://github.com/kim-1868/miaowu-english-public/actions/runs/42387278052) 均通过，25 文件 SHA-256 交付包已生成（Artifact ID `13579903426`）。**没有修改私人运行站、没有部署。**


### 2026-11-07 · PUBLIC-10｜公开首页、历史公告页与四个学习 UI 模块迁移（已完成）

- 固定私人开发源版本：`0cf00b37ffa029997436fa3c0b2c67e35b114aa4`，逐项审查并干净复制 `public/index.html`、`public/updates.html`、`public/flashcards.js`、`public/chapter-words.js`、`public/echo-cloud.js`、`public/onboarding.js`。
- 公开前端交付白名单从 18 扩至 24 项；新增浏览器 UI 语法、HTML 模块引用和权限边界的静态合同检查，沿用 SHA-256 构建交付及只读差异预检。
- 所有服务器端权限/订单/激活/运营后台/小说/词库仍留私人；公共首页依赖私人 `/app.js`，**不可能仅凭公开包独立上线**。私人活动分支不做代码替换。
- 关联 [Issue #16](https://github.com/kim-1868/miaowu-english-public/issues/16) 与 [公共 PR #17](https://github.com/kim-1868/miaowu-english-public/pull/17)，已 Squash 合并至公共 `main`，提交 `0105b212b226a9898e7696cd314b999785826278`。修复旧断言后 [PR Node / 安全检查 #42386170949](https://github.com/kim-1868/miaowu-english-public/actions/runs/42386170949) 与 [Chromium 浏览器合成测试 #42386170973](https://github.com/kim-1868/miaowu-english-public/actions/runs/42386170973) 均成功，[合并后主分支构建 #42386247604](https://github.com/kim-1868/miaowu-english-public/actions/runs/42386247604) 成功并上传 24 文件 SHA-256 Artifact（ID 13579168592）。
- **同名文件差异**：对照私人最新 V1.1 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`，24 项中 20 项 Git blob 完全一致、4 项存在公共专属更新：`public/site-updates.js`、`public/v11-reader.css`、`public/v11-responsive.css`、`public/v11-wordbook.css`，仍未自动整合。
- **执行规范**：新增 [PUBLIC_FRONTEND_OWNERSHIP_20261107.md](PUBLIC_FRONTEND_OWNERSHIP_20261107.md)，之后公开 UI 默认公共开发、私人敏感业务与最终发布保留私人。


### 2026-11-07 · CI-COST-02｜私人预览测试-only 更新不再重复部署

- 私人 [PR #189](https://github.com/kim-1868/miaowu-english/pull/189) 已合并到 V1.1 活动分支，提交 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`。
- 私人预览 `v11-preview-staging.yml` 的 `paths` 移除仅测试文件 `tests/v11-announcements-preview.test.mjs`，其它实际公告、首页及运营台代码路径保留；手动预览、部署前全套测试、预览密码验证和测试 D1 隔离不变。
- 没有部署正式/预览站、没有修改 Cloudflare、账户、订单、小说或数据库。此次为 CI 触发优化，尚未通过下一次源代码预览发布验证实际节省分钟。


### 2026-11-07 · PUBLIC-09｜公共前端交付的只读整合预检（已合并）

- **目标**：公开工具对公共 UI 的 18 文件 SHA-256 交付包做离线完整性验证，并和本地私人代码 checkout 生成相同/待审阅/缺失的文件差异清单，杜绝直接覆盖正在开发的网站。
- **改动**：新增 `scripts/plan-public-ui-handoff.mjs`、`tests/public-handoff.test.mjs`；扩展文件白名单、Node 检查、README 使用说明。
- **安全范围**：不复制、上传、替换私人代码，不连接网络/D1/Cloudflare；源公共完整提交 SHA 需独立人工选择，不能把 manifest 字段当可信签名。
- **合并版本**：[PR #15](https://github.com/kim-1868/miaowu-english-public/pull/15) 已合并，公共提交 `1cc2f465889a306e0240651ee3c06be65fc5f435`；[PR Actions 42385304701](https://github.com/kim-1868/miaowu-english-public/actions/runs/42385304701) 与 [主分支检查 42385335370](https://github.com/kim-1868/miaowu-english-public/actions/runs/42385335370) 均通过。
- **实际差异核对**：公共 `1cc2f465889a306e0240651ee3c06be65fc5f435` 对照私人 V1.1 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4` 的 18 个公开文件，14 个一致、4 个待逐项整合：`public/site-updates.js`、`public/v11-reader.css`、`public/v11-wordbook.css`、`public/v11-responsive.css`。均存在于私人站，不是缺失；没有自动覆盖或发布。


### 2026-11-07 · PUBLIC-08｜公开 UI 的 Chromium 多屏宽验证（已合并）

- 在公共标准 GitHub Actions 使用支持 Playwright 1.56.1 的 Ubuntu 24.04，针对完全虚构的书架/阅读器/词卡做真实 Chromium 布局检查，不使用私人数据库或 Cloudflare 密钥。
- 手机 320/375/390/430px、平板 768px、电脑 1024/1440px，验证无横向溢出、移动触控区、字号 12–24px、日/夜模式对比，并上传人工合成截图供审核。
- 关联 [Issue #12](https://github.com/kim-1868/miaowu-english-public/issues/12) 与 [PR #13](https://github.com/kim-1868/miaowu-english-public/pull/13)。PR 已合并到公共 `main`，版本 `323d7c470af5127be9175341e5a56954f9b5fc36`；[Chromium 七屏宽检查 42384640070](https://github.com/kim-1868/miaowu-english-public/actions/runs/42384640070) 通过，合成页面截图 Artifact `public-ui-browser-829dcba65bf18bf04da58a312e5ea4b0387fa32c` 已生成；[公共主分支检查 42384719422](https://github.com/kim-1868/miaowu-english-public/actions/runs/42384719422) 通过。**未部署 Cloudflare、未运行真实手机/生产站测试**。


### 2026-11-07 · PUBLIC-07｜小说标注结构的公开合成测试（公共 CI 已通过并合并）

- **位置**：公共独立分支 `feature/public07-synthetic-annotation-guard-20261107`，不触碰私人开发分支。
- **改动**：新增 `scripts/annotation-contract.mjs`、`tests/annotation-contract.test.mjs`；扩展 `scripts/audit-public.mjs` 的精确白名单、`package.json` 的 JS 语法检查。
- **内容**：用虚构样本验证跨章节重复 ID、未知词卡引用、空白文本、空释义、混合片段，并提供标注数量/实际使用 ID 的统计；不包含真实小说、词库、源站 API 或生产凭据。
- **验证**：6 个 Node 单元测试通过；公共 PR #11 的 GitHub Actions 运行 42384365445 已成功。**这只验证格式引用，不验证词义自然或可上架**。
- **合并**：[公共 PR #11](https://github.com/kim-1868/miaowu-english-public/pull/11) 已 squash 合并，公共提交 `ff09906fe709dc14683f8c43feecdf9f4a6b4ba4`。**生产影响**：无。没有修改正式/预览站、D1、用户学习记录及付费系统，也没有部署。


### 2026-11-07 · PUBLIC-06｜公开前端构建/交付迁移（已完成）

- **目标**：公共 Actions 构建独立、可复核的前端更新包，私人仓库只进行最终敏感集成和受控发布。
- **改动**：新增 `scripts/build-public-ui.mjs` 和 `tests/public-bundle.test.mjs`、更新 `package.json`、安全白名单、`.gitignore`、公共工作流与 README；仅选择 18 个经安全审查的 JS/CSS/SVG 文件。
- **构建交付**：生成 `dist-public-ui/manifest.json`，逐文件 SHA-256，记录公共代码完整提交；公共 `main` 检查通过后保留 14 天 Actions artifact；不自动部署、不联系私人仓库。
- **合并与验证**：[PR #10](https://github.com/kim-1868/miaowu-english-public/pull/10) 已合并，版本 `199c9c4631f0e50f8646bfd46ef9d71ed88afbbf`。公共 [main Actions #42383632259](https://github.com/kim-1868/miaowu-english-public/actions/runs/42383632259) 全部通过，已核实构建包 `wordletter-public-ui-199c9c4631f0e50f8646bfd46ef9d71ed88afbbf`（Artifact ID 13578762144）。只包含 18 个公开前端文件与 SHA-256 清单，没有私人业务代码，也无私人站或 D1 变更。


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
